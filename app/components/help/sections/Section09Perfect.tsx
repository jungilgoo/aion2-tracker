import CodeBlock from '../CodeBlock';
import DataTable from '../DataTable';

export default function Section09Perfect() {
  return (
    <div className="space-y-4 text-gray-200 leading-relaxed">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">9.1 수집 출처</h4>
        <DataTable
          headers={["출처", "계산 방식"]}
          rows={[
            ["타이틀", "직접 퍼센트"],
            ["정의 스탯", "정의 × 0.1% × 2"],
            ["장신구 기본", "직접 퍼센트"],
          ]}
        />
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">9.2 최종 공식</h4>
        <CodeBlock>
{`총완벽% = 타이틀완벽 + 정의완벽 + 장신구완벽

// DPS 계수
완벽계수 = (완벽% / 100) × 0.25  // 1.25배 데미지 → 추가분 0.25`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">9.3 전투 점수 기여도</h4>
        <CodeBlock>
{`기여도 = 완벽% × ((무기최대 - 무기최소) / (무기최대 + 무기최소))`}
        </CodeBlock>
      </div>
    </div>
  );
}
