const { Client } = require('@notionhq/client');

// 노션 클라이언트 초기화
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  // CORS 처리
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 사전 요청(Preflight) 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'POST 요청만 허용됩니다.' });
  }

  try {
    // 프론트엔드에서 보낸 데이터 추출
    const { date, usagePlace, amount, type, cardCompany, category, memo } = req.body;

    // 1. 필수 속성들 구성 (사용처, 사용 날짜, 금액, 유형)
    const properties = {
      '사용처': {
        title: [
          {
            text: {
              content: usagePlace,
            },
          },
        ],
      },
      '사용 날짜': {
        date: {
          start: date,
        },
      },
      '금액': {
        number: Number(amount),
      },
      '유형': {
        select: {
          name: type,
        },
      },
    };

    // 2. 선택적 속성들 구성 (입력값이 있을 때만 노션에 전송)
    // 카드사
    if (cardCompany && cardCompany.trim() !== '') {
      properties['카드사'] = {
        select: {
          name: cardCompany,
        },
      };
    }

    // 카테고리
    if (category && category.trim() !== '') {
      properties['카테고리'] = {
        select: {
          name: category,
        },
      };
    }

    // 메모
    if (memo && memo.trim() !== '') {
      properties['메모'] = {
        rich_text: [
          {
            text: {
              content: memo,
            },
          },
        ],
      };
    }

    // 노션 API 호출하여 데이터베이스에 새 행 추가
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: properties,
    });

    res.status(200).json({ message: '성공적으로 등록되었습니다!', data: response });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ message: '노션 등록 중 오류 발생', error: error.message });
  }
}
