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

if __name__ == '__main__': unittest.main()
