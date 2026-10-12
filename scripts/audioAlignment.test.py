import unittest
from alignAudio import align

class AlignmentTest(unittest.TestCase):
    def test_uneven_speech(self):
        words = [dict(word=w, start=t, end=t+.2) for w,t in [('Một',0),('câu',.2),('ngắn',.5),('Câu',4),('tiếp',4.4),('theo',5)]]
        result = align(['Một câu ngắn', 'Câu tiếp theo'], words)
        self.assertEqual(result[1]['start'], 4)
    def test_missing_narration_is_not_estimated(self):
        with self.assertRaises(ValueError):
            align(['Nội dung hoàn toàn khác'], [dict(word='hello',start=0,end=1)])
    def test_range_and_repeated_phrase(self):
        words = [dict(word=w,start=t,end=t+.1) for w,t in [('hello',0),('world',1),('hello',5),('world',6)]]
        self.assertEqual(align(['hello world'],words,4,8)[0]['start'],5)

    def test_missing_passage_is_reported_even_when_overall_match_is_high(self):
        before = ' '.join(f'word{i}' for i in range(80))
        missing = 'Nhiều người muốn chơi game cùng bạn bè.'
        after = 'Nếu quán tạo được môi trường tốt.'
        words = [dict(word=w, start=i, end=i+.2) for i, w in enumerate((before+' '+after).split())]
        with self.assertRaisesRegex(ValueError, f'01:20.*{missing}'):
            align([before+' '+missing+' '+after], words)
        with self.assertRaisesRegex(ValueError, 'Nhiều người muốn chơi game cùng bạn bè.'):
            align([before, 'Nhiều người muốn', 'chơi game cùng bạn bè.', after], words)

    def test_short_asr_substitution_does_not_block_matching_narration(self):
        words = [dict(word=w, start=i*.2, end=(i+1)*.2) for i,w in enumerate('Một bộ máy tính cấu hình mạnh có thể khá đặt'.split())]
        self.assertGreater(align(['Một bộ máy tính cấu hình mạnh có thể khá đắt'], words)[0]['confidence'], .8)

if __name__ == '__main__': unittest.main()
