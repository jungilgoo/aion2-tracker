import CodeBlock from '../CodeBlock';
import DataTable from '../DataTable';

export default function Section05Speed() {
  return (
    <div className="space-y-4 text-gray-200 leading-relaxed">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">5.1 수집 출처</h4>
        <DataTable
          headers={["출처", "계산 방식"]}
          rows={[
            ["영혼 각인", "직접 합산"],
            ["장신구 기본 옵션", "직접 합산"],
            ["시간 스탯", "시간 × 0.2%"],
            ["데바니온", "직접 합산"],
            ["타이틀", "직접 합산"],
          ]}
        />
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">5.2 DPS 계수 공식</h4>
        <p className="text-sm text-gray-400 mb-2">
          💡 <strong>실제 계산 방식:</strong> 이론상 공식은 아래와 같지만,
          실제 DPS 계산 시에는 <code className="text-blue-400">1 + 전투속도%</code>를
          계수로 사용합니다. (예: 20% → 1.20배)
        </p>
        <CodeBlock>
{`// 이론상 공식
전투속도계수 = 1 / (1 - 전투속도%)

// 안전 장치
if (전투속도 >= 100% || 전투속도 <= 0%) {
  전투속도계수 = 1
}`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">5.3 딜 증가율</h4>
        <DataTable
          headers={["전투속도", "계수", "딜 증가"]}
          rows={[
            ["10%", "1.111", "+11.1%"],
            ["20%", "1.250", "+25.0%"],
            ["30%", "1.429", "+42.9%"],
            ["40%", "1.667", "+66.7%"],
            ["50%", "2.000", "+100.0%"],
          ]}
        />
      </div>
    </div>
  );
}
