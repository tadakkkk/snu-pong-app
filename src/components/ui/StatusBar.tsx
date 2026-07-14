export default function StatusBar() {
  // 모든 페이지 상단에 렌더되는 여백. iOS 네이티브에서는 상태바(시간/와이파이/노치)
  // 높이만큼 콘텐츠를 내려 바로 아래 헤더 버튼이 상태바에 가려지지 않게 한다.
  // 웹/안드로이드 등 인셋이 없는 환경에서는 기존과 동일한 12px 여백을 유지한다.
  // (env(safe-area-inset-top)는 layout viewport의 viewportFit: "cover"가 있어야 값이 잡힌다.)
  return (
    <div style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }} />
  );
}
