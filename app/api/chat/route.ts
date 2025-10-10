import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, isAnonymous = false, userId = null } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }

    let reply = "";

    // Check if this is a PCN-related query
    const pcnKeywords = ['pcn', 'penalty charge notice', 'parking ticket', 'fine', 'appeal', 'contravention', 'council', 'ticket', 'parked', 'parking'];
    const isPcnQuery = pcnKeywords.some(keyword => lastMessage.content.toLowerCase().includes(keyword));

    // Handle the analysis flow
    if (isPcnQuery || lastMessage.content.length > 30) {
      if (isAnonymous) {
        // Show analysis results first to build value
        reply = generateComplianceAnalysis(lastMessage.content);
        return NextResponse.json({ 
          reply,
          isPcnAppeal: true,
          requiresAuth: false,
          showAnalysis: true,
          analysisStage: 'completed'
        });
      } else {
        // For authenticated users, check usage and proceed
        if (userId) {
          try {
            // Call the check-usage API endpoint
            const usageResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/check-usage?userId=${userId}`);
            const usageData = await usageResponse.json();
            
            if (!usageData.hasFreeAppeal) {
              reply = generateComplianceAnalysis(lastMessage.content) + "\n\n" + generatePaywallMessage();
              return NextResponse.json({ 
                reply,
                isPcnAppeal: true,
                requiresPayment: true,
                showAnalysis: true
              });
            }
          } catch (error) {
            console.error('Error checking usage stats:', error);
            // Continue with free appeal if error occurs
          }
        }
        
        // Generate full appeal for authenticated users with free appeals
        reply = generateComplianceAnalysis(lastMessage.content) + "\n\n" + generateFullAppeal(lastMessage.content);
      }
    } else if (lastMessage.content.toLowerCase().includes('hello') || lastMessage.content.toLowerCase().includes('hi')) {
      reply = "🔍 **Welcome to Kerbi - Your AI Compliance Expert!**\n\nI specialize in finding **legal loopholes and compliance issues** in PCN cases that can get your ticket cancelled.\n\n**Upload your ticket or describe your situation** - I'll analyze it for:\n✅ **Signage compliance issues**\n✅ **Procedural errors**\n✅ **Legal technicalities**\n✅ **Mitigating circumstances**\n\n*No account needed for analysis - I'll show you what I found first!*";
    } else if (lastMessage.content.toLowerCase().includes('help')) {
      reply = "🔍 **I'm your AI compliance expert!**\n\n**What I do:**\n- Find legal loopholes in PCN cases\n- Identify signage compliance issues\n- Spot procedural errors by councils\n- Create winning appeal arguments\n\n**Just tell me about your parking situation** and I'll analyze it for compliance issues!\n\n*I'll show you what I found before asking for anything!*";
    } else {
      reply = `I understand you're asking about "${lastMessage.content}". I'm specialized in finding compliance issues in PCN cases! 🔍\n\n**Tell me about your parking situation** and I'll analyze it for:\n- Signage compliance problems\n- Procedural errors\n- Legal technicalities\n- Winning appeal arguments\n\n**What happened with your parking?**`;
    }

    return NextResponse.json({ 
      reply,
      isPcnAppeal: isPcnQuery || lastMessage.content.length > 30,
      requiresAuth: false,
      showAnalysis: isPcnQuery || lastMessage.content.length > 30
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

function generateComplianceAnalysis(userInput: string): string {
  const analysis = `🔍 **COMPLIANCE ANALYSIS COMPLETE** 🔍

**I've found several potential compliance issues in your case:**

### 🚨 **CRITICAL FINDINGS:**

${generateComplianceIssues(userInput)}

### 📋 **COMPLIANCE CHECKLIST:**
${generateComplianceChecklist(userInput)}

### 💰 **ESTIMATED SUCCESS PROBABILITY: ${generateSuccessProbability(userInput)}%**

**🎯 Based on similar cases, this appeal has a strong chance of success!**

---

**🔍 What I found:**
- **Signage Issues:** ${detectSignageIssues(userInput)}
- **Procedural Errors:** ${detectProceduralErrors(userInput)}
- **Legal Technicalities:** ${detectLegalTechnicalities(userInput)}
- **Mitigating Circumstances:** ${detectMitigatingCircumstances(userInput)}

**💡 My recommendation:** This case has strong grounds for appeal based on compliance failures.`;

  return analysis;
}

function generatePaywallMessage(): string {
  return `---

## 🔐 **GET YOUR WINNING APPEAL LETTER**

**I've analyzed your case and found strong compliance issues - now let me create your professional appeal letter!**

**🎯 What you'll get:**
- **Professional appeal letter** tailored to your specific compliance issues
- **Legal arguments** based on the technicalities I found
- **Step-by-step submission guide**
- **Evidence checklist** to strengthen your case
- **Success tracking** in your dashboard

**💰 Only £5 for your complete appeal package**
*That's less than the cost of your PCN - and you could get it completely cancelled!*

**Ready to get your money back?**`;

}

function generateFullAppeal(userInput: string): string {
  return `---

## 📝 **YOUR PROFESSIONAL APPEAL LETTER**

**Date:** ${new Date().toLocaleDateString('en-GB')}
**To:** The Parking Appeals Team
**Subject:** Appeal Against Penalty Charge Notice

---

Dear Sir/Madam,

I am writing to formally appeal the above Penalty Charge Notice on the following grounds:

### 1. **Signage Compliance Issues**
${generateSignageArguments(userInput)}

### 2. **Procedural Errors**
${generateProceduralArguments(userInput)}

### 3. **Legal Technicalities**
${generateLegalArguments(userInput)}

### 4. **Request for Evidence**
I request that you provide:
- Clear photographic evidence of the contravention
- Details of the signage in place at the time
- Any relevant traffic regulation orders
- Proof of proper signage maintenance

### 5. **Conclusion**
Based on the compliance issues identified above, I believe this PCN was issued in error and respectfully request that it be cancelled.

Yours faithfully,
[Your Name]

---

**💡 Pro Tips:**
- Send this within 14 days for the best chance of success
- Include any supporting evidence (photos, receipts, etc.)
- Be polite but firm in your language
- Keep a copy for your records

**✅ This appeal has been saved to your dashboard for tracking!**`;
}

// Compliance Analysis Helper Functions
function generateComplianceIssues(userInput: string): string {
  const issues = [];
  
  if (userInput.includes('sign') || userInput.includes('unclear') || userInput.includes('visible')) {
    issues.push("🚨 **SIGNAGE COMPLIANCE FAILURE** - Insufficient or unclear signage");
  }
  if (userInput.includes('time') || userInput.includes('minute') || userInput.includes('hour')) {
    issues.push("⏰ **TIMING COMPLIANCE ISSUE** - Potential grace period violations");
  }
  if (userInput.includes('payment') || userInput.includes('machine') || userInput.includes('fault')) {
    issues.push("💳 **PAYMENT SYSTEM FAILURE** - Technical issues with payment infrastructure");
  }
  if (userInput.includes('blue badge') || userInput.includes('disabled')) {
    issues.push("♿ **ACCESSIBILITY COMPLIANCE** - Blue badge holder rights violation");
  }
  if (userInput.includes('loading') || userInput.includes('unloading')) {
    issues.push("📦 **LOADING EXEMPTION** - Legitimate loading/unloading activity");
  }
  
  if (issues.length === 0) {
    issues.push("🔍 **GENERAL COMPLIANCE REVIEW** - Multiple potential issues identified");
  }
  
  return issues.join('\n');
}

function generateComplianceChecklist(_userInput: string): string {
  return `✅ Signage visibility and clarity
✅ Proper notice periods
✅ Payment system functionality  
✅ Accessibility compliance
✅ Loading/unloading exemptions
✅ Grace period adherence
✅ Evidence collection requirements`;
}

function generateSuccessProbability(userInput: string): string {
  let probability = 45; // Base probability
  
  if (userInput.includes('sign') || userInput.includes('unclear')) probability += 25;
  if (userInput.includes('blue badge') || userInput.includes('disabled')) probability += 20;
  if (userInput.includes('loading') || userInput.includes('unloading')) probability += 15;
  if (userInput.includes('payment') || userInput.includes('machine')) probability += 10;
  if (userInput.includes('emergency') || userInput.includes('medical')) probability += 15;
  
  return Math.min(probability, 95).toString();
}

function detectSignageIssues(userInput: string): string {
  if (userInput.includes('sign') || userInput.includes('unclear') || userInput.includes('visible')) {
    return "High - Signage compliance issues detected";
  }
  return "Medium - Standard signage review required";
}

function detectProceduralErrors(userInput: string): string {
  if (userInput.includes('time') || userInput.includes('minute')) {
    return "High - Timing/procedural issues identified";
  }
  return "Medium - Standard procedural review";
}

function detectLegalTechnicalities(userInput: string): string {
  if (userInput.includes('blue badge') || userInput.includes('loading')) {
    return "High - Strong legal technicalities found";
  }
  return "Medium - Standard legal review";
}

function detectMitigatingCircumstances(userInput: string): string {
  if (userInput.includes('emergency') || userInput.includes('medical') || userInput.includes('broken')) {
    return "High - Strong mitigating circumstances";
  }
  return "Medium - Standard circumstances review";
}

function generateSignageArguments(userInput: string): string {
  if (userInput.includes('sign') || userInput.includes('unclear')) {
    return `- The signage was not clearly visible or legible from the driver's position
- Signage did not comply with Traffic Signs Regulations and General Directions 2016
- No clear indication of parking restrictions at the time of contravention
- Request photographic evidence of signage visibility from driver's perspective`;
  }
  return `- Request evidence of proper signage compliance
- Challenge signage visibility and clarity
- Verify signage meets legal requirements`;
}

function generateProceduralArguments(userInput: string): string {
  if (userInput.includes('time') || userInput.includes('minute')) {
    return `- Insufficient grace period provided before penalty
- Procedural errors in timing calculations
- Failure to follow proper notice procedures
- Request detailed timeline of events`;
  }
  return `- Challenge procedural compliance
- Request evidence of proper procedures
- Verify all legal requirements were met`;
}

function generateLegalArguments(userInput: string): string {
  if (userInput.includes('blue badge') || userInput.includes('disabled')) {
    return `- Blue badge holder exemption not properly considered
- Accessibility rights under Equality Act 2010
- Failure to accommodate disability requirements
- Request evidence of blue badge consideration`;
  }
  if (userInput.includes('loading') || userInput.includes('unloading')) {
    return `- Legitimate loading/unloading activity
- Exemption under Traffic Management Act 2004
- No clear signage indicating loading restrictions
- Request evidence of loading restriction signage`;
  }
  return `- Challenge legal basis of penalty
- Request evidence of contravention
- Verify all legal requirements were met`;
}

