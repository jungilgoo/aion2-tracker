import CodeBlock from '../CodeBlock';
import DataTable from '../DataTable';

export default function Section03DamageAmp() {
  return (
    <div className="space-y-4 text-gray-200 leading-relaxed">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">3.1 4가지 피해 증폭 타입</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>무기 피해 증폭</strong></li>
          <li><strong>PVE 피해 증폭</strong></li>
          <li><strong>피해 증폭 (일반)</strong></li>
          <li><strong>치명타 피해 증폭</strong></li>
        </ol>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">3.2 기본 공식</h4>
        <CodeBlock>
{`// 각 타입별 계산
타입별_최종% = 영혼각인% + 장비기본% + 마석변환% + 데바니온% + 아리엘% + 타이틀%

// 마석 정수 → 퍼센트 변환
퍼센트 = (마석정수 / 10) × 0.1%

// 주의: 치명타 피해 증폭은 단순 합산이 아님!
// - 기본 피해증폭 (항상 적용): 무기 + PVE + 일반
// - 치명타 피해증폭 (확률 기반): 별도 기댓값 계산 (섹션 7.3 참조)`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">3.3 출처별 수집 가능 타입</h4>
        <DataTable
          headers={["출처", "무기", "PVE", "일반", "치명타"]}
          rows={[
            ["영혼 각인 (%)", "✅", "✅", "✅", "✅"],
            ["장비 기본 (%)", "✅", "✅", "❌", "❌"],
            ["마석 (정수)", "✅", "✅", "✅", "✅"],
            ["데바니온 (%)", "✅", "✅", "✅", "✅"],
            ["아리엘 (%)", "❌", "✅", "❌", "❌"],
            ["타이틀 (%)", "✅", "✅", "✅", "❌"],
          ]}
        />
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">3.4 키워드 우선순위</h4>
        <CodeBlock>
{`구체적 키워드 우선:
"무기 피해 증폭" > "PVE 피해 증폭" > "치명타 피해 증폭" > "피해 증폭"`}
        </CodeBlock>
      </div>
    </div>
  );
}
