import Hero from "../components/Hero";
import Containers from "../components/Containers";
import TrustIndicators from "../components/TrustIndicators";
import ComingSoon from "../components/ComingSoon";

export default function HomePage() {
  return (
    <div>
      <Hero />
      <Containers />
      <TrustIndicators />
      <ComingSoon />
    </div>
  );
}