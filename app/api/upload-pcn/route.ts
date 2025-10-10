import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64 for OpenAI Vision API
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = image.type;

    // Use OpenAI Vision API to analyze the PCN image
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this PCN (Penalty Charge Notice) image and extract the following information in JSON format:
                {
                  "numberPlate": "vehicle registration number",
                  "pcnNumber": "PCN reference number", 
                  "amount": "penalty amount in pounds (number only)",
                  "date": "date of contravention",
                  "location": "location where contravention occurred",
                  "contravention": "description of the contravention",
                  "council": "issuing council/authority",
                  "paymentDueDate": "payment due date"
                }
                
                Also provide a full text transcription of all visible text in the image.
                
                Focus on finding compliance issues like:
                - Unclear signage
                - Timing issues
                - Payment system problems
                - Accessibility issues
                - Procedural errors`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const analysisText = openaiData.choices[0].message.content;

    // Parse the JSON response from OpenAI
    let extractedData;
    const fullText = analysisText;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to mock data if JSON parsing fails
        extractedData = {
          numberPlate: 'Not detected',
          pcnNumber: 'Not detected',
          amount: 0,
          date: 'Not detected',
          location: 'Not detected',
          contravention: 'Not detected',
          council: 'Not detected',
          paymentDueDate: 'Not detected'
        };
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback to mock data
      extractedData = {
        numberPlate: 'Not detected',
        pcnNumber: 'Not detected', 
        amount: 0,
        date: 'Not detected',
        location: 'Not detected',
        contravention: 'Not detected',
        council: 'Not detected',
        paymentDueDate: 'Not detected'
      };
    }

    return NextResponse.json({
      success: true,
      extractedData,
      fullText,
      imageUrl: null // We don't need to store the image URL since we processed it directly
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process image with OpenAI Vision API' }, 
      { status: 500 }
    );
  }
}
