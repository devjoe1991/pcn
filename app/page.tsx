import Hero from "../components/Hero";
import Containers from "../components/Containers";
import JoinKerbi from "../components/JoinKerbi";
import TrustIndicators from "../components/TrustIndicators";

export default function HomePage() {
  return (
    <div>
      <Hero />
      <Containers />
      <JoinKerbi />
      <TrustIndicators />
    </div>
  );
}