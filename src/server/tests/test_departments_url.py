from __future__ import annotations

import sys
import unittest
from pathlib import Path


# crawling_rules/departments 를 import 경로에 추가 (패키지화돼 있지 않음)
DEPARTMENTS_DIR = (
    Path(__file__).resolve().parents[1] / "crawling_rules" / "departments"
)
if str(DEPARTMENTS_DIR) not in sys.path:
    sys.path.insert(0, str(DEPARTMENTS_DIR))

import Departments as D  # noqa: E402


class NormalizeArticleUrlTests(unittest.TestCase):
    def test_gnuboard_keeps_bo_table_and_wr_id(self):
        # board.php?bo_table&wr_id 는 글 단위 식별자가 보존돼야 한다 (검색/페이지 쿼리는 제거).
        url = "https://bcs.snu.ac.kr/bbs/board.php?bo_table=notice&wr_id=123&page=2"
        self.assertEqual(
            D._normalize_article_url(url),
            "https://bcs.snu.ac.kr/bbs/board.php?bo_table=notice&wr_id=123",
        )

    def test_do_board_keeps_board_id_and_menu_no(self):
        # cbe 케이스: view.do?boardId&menuNo 는 보존돼야 게시판 루트로 붕괴되지 않는다.
        url = "http://cbe.snu.ac.kr/cbe/bbs/BMSR00058/view.do?boardId=5678&menuNo=42&page=1"
        normalized = D._normalize_article_url(url)
        self.assertIn("boardId=5678", normalized)
        self.assertIn("menuNo=42", normalized)
        self.assertNotIn("page=1", normalized)


class UnstableBoardUrlTests(unittest.TestCase):
    def test_anchor_only_board_php_is_unstable(self):
        # brainscience 케이스: 글 ID 없는 board.php 앵커 링크는 게시판 루트라 스킵 대상.
        normalized = D._normalize_article_url(
            "http://brainscience.snu.ac.kr/bbs/board.php#con-anc"
        )
        self.assertTrue(D._is_unstable_board_url(normalized))

    def test_param_less_do_endpoint_is_unstable(self):
        # 식별 파라미터가 0개인 .do 엔드포인트도 게시판 루트로 간주해 스킵.
        self.assertTrue(
            D._is_unstable_board_url("http://cbe.snu.ac.kr/cbe/bbs/BMSR00058/view.do")
        )

    def test_do_board_with_identifiers_is_stable(self):
        # boardId/menuNo 가 보존된 .do 글 URL 은 안정적이라 스킵하면 안 된다.
        self.assertFalse(
            D._is_unstable_board_url(
                "http://cbe.snu.ac.kr/cbe/bbs/BMSR00058/view.do?boardId=5678&menuNo=42"
            )
        )

    def test_gnuboard_article_is_stable(self):
        self.assertFalse(
            D._is_unstable_board_url(
                "https://bcs.snu.ac.kr/bbs/board.php?bo_table=notice&wr_id=123"
            )
        )

    def test_static_detail_page_is_not_discarded(self):
        # 정적 경로 기반 상세페이지(스크립트 확장자 아님)는 식별 파라미터가 없어도 보존.
        self.assertFalse(
            D._is_unstable_board_url(
                "https://example.snu.ac.kr/boards/notice/41018/detail/"
            )
        )


if __name__ == "__main__":
    unittest.main()
