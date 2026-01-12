import CodeBlock from '../CodeBlock';
import DataTable from '../DataTable';

export default function Section08Strike() {
  return (
    <div className="space-y-4 text-gray-300">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">8.1 수집 출처</h4>
        <DataTable
          headers={["출처", "계산 방식"]}
          rows={[
            ["타이틀", "직접 퍼센트"],
            ["지혜 스탯", "지혜 × 0.1% × 2"],
          ]}
        />
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">8.2 최종 공식</h4>
        <CodeBlock>
{`총강타% = 타이틀강타 + 지혜강타

// DPS 계수
강타계수 = (강타% / 100) × 1.0  // 2배 데미지 → 추가분 1.0`}
        </CodeBlock>
      </div>
    </div>
  );
}
