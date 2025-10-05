export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Kerbi - AI-Powered PCN Appeal Assistant",
    "description": "Meet Kerbi, your revolutionary AI-powered PCN appeal buddy. Get out of paying parking tickets with our specialized AI system that tracks and appeals PCN violations with 99.2% success rate.",
    "url": "https://appealyourpcn.com",
    "applicationCategory": "LegalTech",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "15000",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "AI-powered PCN appeal generation",
      "Automated legal loophole detection", 
      "Progress tracking dashboard",
      "99.2% success rate",
      "Real-time case monitoring"
    ],
    "creator": {
      "@type": "Organization",
      "name": "AppealYourPCN",
      "url": "https://appealyourpcn.com"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
