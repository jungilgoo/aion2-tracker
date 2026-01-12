import CodeBlock from '../CodeBlock';
import DataTable from '../DataTable';

export default function Section07Critical() {
  return (
    <div className="space-y-4 text-gray-300">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">7.1 수집 출처</h4>
        <DataTable
          headers={["출처", "타입", "계산 방식"]}
          rows={[
            ["무기/가더 기본", "정수", "직접 합산"],
            ["영혼 각인", "정수", "직접 합산"],
            ["마석 각인", "정수", "직접 합산"],
            ["데바니온 (4개)", "정수", "직접 합산"],
            ["죽음 스탯", "퍼센트", "죽음 × 0.2%"],
            ["정확 스탯", "퍼센트", "정확 × 0.1%"],
          ]}
        />
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">7.2 최종 계산 공식</h4>
        <CodeBlock>
{`// 1단계: 정수 합산
총정수 = 기본옵션 + 영혼각인 + 마석 + 데바니온

// 2단계: 퍼센트 배율
퍼센트배율 = 1 + (죽음% + 정확%) / 100
최종정수 = Math.round(총정수 × 퍼센트배율)

// 3단계: 확률 변환 (중요!)
치명타확률(%) = (최종정수 × 0.7) / 10`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">7.3 치명타 피해 증폭 기여도</h4>
        <CodeBlock>
{`BASE_CRITICAL_DAMAGE = 1.5
증폭데미지 = 1.5 + (치명타피해증폭% / 100)
p = 치명타확률% / 100

기본기댓값 = (1 - p) × 1 + p × 1.5
증폭기댓값 = (1 - p) × 1 + p × 증폭데미지

전투점수기여도 = ((증폭기댓값 / 기본기댓값) - 1) × 100`}
        </CodeBlock>
      </div>
    </div>
  );
}
