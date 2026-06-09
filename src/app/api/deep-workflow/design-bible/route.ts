import { NextResponse } from 'next/server';
import { getTextModelFallback } from '@/lib/image-models';
import type { ProductAnalysis } from '../analyze/route';

export interface DesignBible {
  visual_style: string;
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  lighting_style: string;
  camera_style: string;
  headline_style: string;
  font_style: {
    family: string;
    headline_weight: string;
    body_weight: string;
    style_description: string;
  };
  composition_style: string;
  emotion_style: string;
  product_presentation: string;
}

export interface DesignBibleRequest {
  analysis: ProductAnalysis;
  platform: string;
  selectedHolidays: string[];
  selectedAudiences: string[];
  visualStyle: string;
  colorScheme: string;
  customColors?: {
    primary: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  emotion: string;
}

// Predefined color schemes with exact hex codes
const COLOR_SCHEMES: Record<string, { primary: string; secondary: string; accent: string; background: string; text: string; desc: string }> = {
  'ocean_blue': {
    primary: '#1E3A5F',
    secondary: '#4682B4',
    accent: '#87CEEB',
    background: '#F0F8FF',
    text: '#1E3A5F',
    desc: 'Ocean Blue theme: Deep navy primary (#1E3A5F), steel blue secondary (#4682B4), sky blue accent (#87CEEB), light background (#F0F8FF)'
  },
  'warm_beige': {
    primary: '#8B7355',
    secondary: '#D4C4A8',
    accent: '#C8963E',
    background: '#F5F1E8',
    text: '#5C4A32',
    desc: 'Warm Beige theme: Earthy brown primary (#8B7355), soft beige secondary (#D4C4A8), golden accent (#C8963E), cream background (#F5F1E8)'
  },
  'natural_wood': {
    primary: '#8B4513',
    secondary: '#CD853F',
    accent: '#DEB887',
    background: '#FAF0E6',
    text: '#5D3A1A',
    desc: 'Natural Wood theme: Saddle brown primary (#8B4513), peru secondary (#CD853F), burlywood accent (#DEB887), linen background (#FAF0E6)'
  },
  'luxury_black': {
    primary: '#1A1A1A',
    secondary: '#333333',
    accent: '#C9A961',
    background: '#F8F8F8',
    text: '#1A1A1A',
    desc: 'Luxury Black theme: Rich black primary (#1A1A1A), dark gray secondary (#333333), gold accent (#C9A961), off-white background (#F8F8F8)'
  },
  'christmas_red': {
    primary: '#B22222',
    secondary: '#228B22',
    accent: '#FFD700',
    background: '#FFFAFA',
    text: '#8B0000',
    desc: 'Christmas theme: Firebrick red primary (#B22222), forest green secondary (#228B22), gold accent (#FFD700), snow background (#FFFAFA)'
  },
  'dark_green': {
    primary: '#2F4F4F',
    secondary: '#3CB371',
    accent: '#98FB98',
    background: '#F0FFF0',
    text: '#1C3A3A',
    desc: 'Dark Green theme: Dark slate gray primary (#2F4F4F), medium sea green secondary (#3CB371), pale green accent (#98FB98), honeydew background (#F0FFF0)'
  },
  'pastel_pink': {
    primary: '#C71585',
    secondary: '#FFB6C1',
    accent: '#FFC0CB',
    background: '#FFF0F5',
    text: '#8B0A50',
    desc: 'Pastel Pink theme: Medium violet red primary (#C71585), light pink secondary (#FFB6C1), pink accent (#FFC0CB), lavender blush background (#FFF0F5)'
  },
  'monochrome': {
    primary: '#000000',
    secondary: '#808080',
    accent: '#C0C0C0',
    background: '#FFFFFF',
    text: '#333333',
    desc: 'Monochrome theme: Black primary (#000000), gray secondary (#808080), silver accent (#C0C0C0), white background (#FFFFFF)'
  },
};

export async function POST(request: Request) {
  try {
    const body: DesignBibleRequest = await request.json();
    const { analysis, platform, selectedHolidays, selectedAudiences, visualStyle, colorScheme, customColors, emotion } = body;

    if (!analysis) {
      return NextResponse.json({ success: false, error: '缺少产品分析数据' }, { status: 400 });
    }

    // Get color scheme - use custom colors if provided, otherwise use predefined
    let selectedScheme;
    if (colorScheme === 'custom' && customColors?.primary) {
      // AI will generate the complete color palette based on primary color
      selectedScheme = {
        primary: customColors.primary,
        secondary: customColors.secondary || 'AI_GENERATED',
        accent: customColors.accent || 'AI_GENERATED',
        background: customColors.background || 'AI_GENERATED',
        text: customColors.text || 'AI_GENERATED',
        desc: `Custom color theme based on primary color ${customColors.primary}. AI will generate harmonious secondary, accent, background, and text colors.`
      };
    } else {
      selectedScheme = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES['warm_beige'];
    }

    const model = getTextModelFallback();

    // Build dimensions info if available
    const dimensionsInfo = analysis.dimensions ? `
Product Dimensions:
${analysis.dimensions.length ? `- Length: ${analysis.dimensions.length}` : ''}
${analysis.dimensions.width ? `- Width: ${analysis.dimensions.width}` : ''}
${analysis.dimensions.height ? `- Height: ${analysis.dimensions.height}` : ''}
${analysis.dimensions.diameter ? `- Diameter: ${analysis.dimensions.diameter}` : ''}
${analysis.dimensions.weight ? `- Weight: ${analysis.dimensions.weight}` : ''}
${analysis.dimensions.custom_size ? `- Size Notes: ${analysis.dimensions.custom_size}` : ''}
IMPORTANT: Use these dimensions to accurately show product scale in images.` : '';

    const designPrompt = `Create a comprehensive Design Bible for Amazon Listing images.

Product Information:
- Name: ${analysis.product_name}
- Type: ${analysis.product_type}
- Material: ${analysis.material}
- Selling Points: ${analysis.selling_points.join(', ')}
- Target Audience: ${selectedAudiences.join(', ') || analysis.target_audience.join(', ')}
- Holidays: ${selectedHolidays.join(', ') || analysis.recommended_holidays.join(', ')}
${dimensionsInfo}

User Preferences:
- Platform: ${platform}
- Visual Style: ${visualStyle}
- Color Scheme: ${colorScheme}
- Emotion: ${emotion}

${colorScheme === 'custom' && customColors?.primary ? `
CRITICAL - GENERATE COLOR PALETTE FROM PRIMARY COLOR:
User selected primary color: ${customColors.primary}

You MUST generate a harmonious 5-color palette based on this primary color, considering ALL these factors:

1. PRIMARY COLOR (User Selected - MUST use exactly):
   - ${customColors.primary}

2. TARGET AUDIENCE (Consider their preferences and cultural background):
   - ${selectedAudiences.join(', ') || analysis.target_audience.join(', ')}

3. TARGET HOLIDAYS/OCCASIONS (Consider traditional colors and themes):
   - ${selectedHolidays.join(', ') || analysis.recommended_holidays.join(', ')}

4. VISUAL STYLE (Colors must match this aesthetic):
   - ${visualStyle}

5. EMOTION (Colors should evoke this feeling):
   - ${emotion}

GENERATE THESE 5 COLORS:
- Primary: ${customColors.primary} (keep exactly as user selected)
- Secondary: Generate a color that complements primary AND suits the target audience/holiday/style
- Accent: Generate a contrasting color for CTAs, considering holiday themes if applicable
- Background: Generate a light background that works with the overall mood
- Text: Generate a dark color with good contrast, matching the style's tone

IMPORTANT:
- If target holidays include Christmas, consider red/green accents
- If target holidays include Valentine's Day, consider pink/red romantic tones
- If target audience is children, use brighter, more playful colors
- If target audience is luxury/high-end, use sophisticated, muted tones
- All colors must harmonize with ${visualStyle} aesthetic
- Colors must evoke ${emotion} emotion` : `
CRITICAL - USE EXACT COLOR PALETTE:
${selectedScheme.desc}

MANDATORY COLOR PALETTE (use these EXACT hex codes):
- Primary: ${selectedScheme.primary}
- Secondary: ${selectedScheme.secondary}
- Accent: ${selectedScheme.accent}
- Background: ${selectedScheme.background}
- Text: ${selectedScheme.text}`}

Generate a Design Bible JSON with these exact fields:
{
  "visual_style": "Detailed visual style description matching ${visualStyle} and ${emotion} emotion",
  "color_palette": {
    "primary": "${colorScheme === 'custom' && customColors?.primary ? customColors.primary : selectedScheme.primary}",
    "secondary": "${colorScheme === 'custom' && customColors?.primary ? '[AI_GENERATED]' : selectedScheme.secondary}",
    "accent": "${colorScheme === 'custom' && customColors?.primary ? '[AI_GENERATED]' : selectedScheme.accent}",
    "background": "${colorScheme === 'custom' && customColors?.primary ? '[AI_GENERATED]' : selectedScheme.background}",
    "text": "${colorScheme === 'custom' && customColors?.primary ? '[AI_GENERATED]' : selectedScheme.text}"
  },
  "lighting_style": "Specific lighting approach that complements ${colorScheme} colors",
  "camera_style": "Camera and lens style (e.g., 'DSLR quality, 50mm lens, shallow depth of field')",
  "headline_style": "How headlines should appear (e.g., 'Bold uppercase, centered, generous spacing')",
  "font_style": {
    "family": "Specific font family (e.g., 'Helvetica Neue, Arial, sans-serif')",
    "headline_weight": "Font weight for headlines (e.g., '700 Bold')",
    "body_weight": "Font weight for body text (e.g., '400 Regular')",
    "style_description": "Typography style notes"
  },
  "composition_style": "Composition rules (e.g., 'Product-centered, rule of thirds, generous negative space')",
  "emotion_style": "Emotional tone description matching ${emotion}",
  "product_presentation": "How product should be shown for ${analysis.product_type}"
}

Requirements:
- MUST use the EXACT hex codes provided above for color_palette
- Colors must work together harmoniously
- Style must match the product type and target audience
- All 6 listing images should feel cohesive using this bible
- Font choices must be clean and readable for e-commerce
- Output ONLY the JSON object, no markdown`;

    const response = await fetch(model.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify({
        model: model.modelName,
        messages: [{
          role: 'user',
          content: [{ type: 'text', text: designPrompt }]
        }]
      }),
    });

    const result = await response.json();
    
    if (!result.choices || !result.choices[0]?.message?.content) {
      return NextResponse.json({ success: false, error: 'Design Bible生成失败' }, { status: 500 });
    }

    let designBible: DesignBible;
    try {
      let content = result.choices[0].message.content;
      content = content.replace(/```json\s*/g, '').replace(/\s*```/g, '').trim();
      designBible = JSON.parse(content);
      
      // For custom colors, use AI-generated palette from response; for predefined, enforce exact scheme
      if (colorScheme === 'custom' && customColors?.primary) {
        // Keep AI-generated palette but ensure primary matches user selection
        designBible.color_palette = {
          primary: customColors.primary,
          secondary: designBible.color_palette?.secondary || '#E8E4DB',
          accent: designBible.color_palette?.accent || '#C4A77D',
          background: designBible.color_palette?.background || '#FAF9F7',
          text: designBible.color_palette?.text || '#2D2D2D'
        };
      } else {
        // For predefined schemes, enforce exact colors
        designBible.color_palette = {
          primary: selectedScheme.primary,
          secondary: selectedScheme.secondary,
          accent: selectedScheme.accent,
          background: selectedScheme.background,
          text: selectedScheme.text
        };
      }
    } catch (parseError) {
      console.error('Design Bible parse error:', parseError);
      // Fallback design bible with selected color scheme
      designBible = {
        visual_style: `${visualStyle.replace('_', ' ')} - Clean, sophisticated, and ${emotion} presentation`,
        color_palette: colorScheme === 'custom' && customColors?.primary ? {
          primary: customColors.primary,
          secondary: '#E8E4DB',
          accent: '#C4A77D',
          background: '#FAF9F7',
          text: '#2D2D2D'
        } : {
          primary: selectedScheme.primary,
          secondary: selectedScheme.secondary,
          accent: selectedScheme.accent,
          background: selectedScheme.background,
          text: selectedScheme.text
        },
        lighting_style: `Soft ${colorScheme.replace('_', ' ')} lighting with gentle shadows, studio quality`,
        camera_style: 'Professional DSLR, 50mm lens, shallow depth of field for detail shots',
        headline_style: 'Bold, uppercase, centered, generous letter spacing',
        font_style: {
          family: 'Helvetica Neue, Arial, sans-serif',
          headline_weight: '700 Bold',
          body_weight: '400 Regular',
          style_description: 'Clean sans-serif, modern and highly readable'
        },
        composition_style: 'Product-centered with generous negative space, rule of thirds for lifestyle shots',
        emotion_style: `${emotion} - Warm, inviting, gift-worthy elegance`,
        product_presentation: 'Hero product shots on clean backgrounds, lifestyle context for usage demonstration'
      };
    }

    return NextResponse.json({
      success: true,
      designBible
    });

  } catch (error) {
    console.error('Design Bible generation failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: '生成失败，请重试' 
    }, { status: 500 });
  }
}
