"""Align supplied narration chunks to locally transcribed word timestamps."""
import difflib
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import unicodedata


def tokens(text):
    text = unicodedata.normalize('NFD', text.casefold().replace('đ', 'd'))
    text = ''.join(c for c in text if not unicodedata.combining(c))
    return re.findall(r'[\u3400-\u9fff]|[^\W_]+', text, re.UNICODE)


def align(chunks, words, start=0, end=float('inf')):
    words = [w for w in words if w['end'] > start and w['start'] < end]
    observed = [(token, w) for w in words for token in tokens(w['word'])]
    expected, ranges = [], []
    for text in chunks:
        begin = len(expected)
        expected.extend(tokens(text))
        ranges.append((begin, len(expected)))
    matcher = difflib.SequenceMatcher(None, expected, [t for t, _ in observed], autojunk=False)
    source = ' '.join(chunks)
    spans = [(m.start(), m.end()) for m in re.finditer(r'\S+', source) for _ in tokens(m.group())]
    for tag, a, b, c, d in matcher.get_opcodes():
        if tag not in ('delete', 'replace') or b - a < 6:
            continue
        missing = source[spans[a][0]:spans[b - 1][1]]
        anchor = observed[c][1]['start'] if c < len(observed) else observed[-1][1]['end'] if observed else start
        minute, second = divmod(int(anchor), 60)
        raise ValueError(
            f'Audio và kịch bản chưa khớp tại khoảng {minute:02d}:{second:02d}. '
            f'Không tìm thấy trong kết quả nhận dạng: “{missing}”. '
            'Hãy dùng audio có đủ lời, sửa lời thoại cho khớp bản thu, hoặc chuyển sang Tạo giọng đọc.'
        )
    mapping = {a + k: b + k for a, b, size in matcher.get_matching_blocks() for k in range(size)}
    result = []
    for index, (begin, finish) in enumerate(ranges):
        matched = [i for i in range(begin, finish) if i in mapping]
        confidence = len(matched) / max(1, finish - begin)
        if confidence < 0.6 or not matched or matched[0] - begin > 3:
            raise ValueError(f'Không tìm được mốc audio đáng tin cậy cho đoạn {index + 1}: “{chunks[index]}”. Hãy đối chiếu lời thoại với bản thu hoặc chuyển sang Tạo giọng đọc.')
        first = max(0, mapping[matched[0]] - (matched[0] - begin))
        last = mapping[matched[-1]]
        result.append({'start': max(start, observed[first][1]['start']), 'end': observed[last][1]['end'], 'confidence': confidence})
    if any(b['start'] <= a['start'] for a, b in zip(result, result[1:])):
        raise ValueError('Không xác định được các mốc lời đọc tăng dần. Hãy kiểm tra audio và kịch bản.')
    return result


def main():
    request = json.load(sys.stdin)
    source = Path(request['audio'])
    model_name = os.environ.get('WEVIC_WHISPER_MODEL', 'small')
    digest = hashlib.sha256(source.read_bytes() + model_name.encode() + b'word-timing-v1').hexdigest()
    cache = Path(tempfile.gettempdir()) / 'wevic-word-timing'
    cache.mkdir(exist_ok=True)
    target = cache / (digest + '.json')
    if target.exists():
        words = json.loads(target.read_text())
    else:
        from faster_whisper import WhisperModel
        model = WhisperModel(model_name, device='cpu', compute_type='int8')
        segments, _ = model.transcribe(str(source), word_timestamps=True, beam_size=5)
        words = [dict(word=w.word, start=w.start, end=w.end) for s in segments for w in s.words]
        temporary = target.with_suffix(f'.{os.getpid()}.tmp')
        temporary.write_text(json.dumps(words, ensure_ascii=False))
        temporary.replace(target)
    if request.get('mode') == 'transcribe':
        if not words or not any(tokens(w['word']) for w in words):
            raise ValueError('Không nhận dạng được lời nói trong audio. Hãy kiểm tra bản thu.')
        print(json.dumps({'text': ' '.join(w['word'].strip() for w in words).strip(), 'words': words, 'model': model_name}, ensure_ascii=False))
    else:
        print(json.dumps(align(request['chunks'], words, request.get('start', 0), request.get('end', float('inf')))))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
