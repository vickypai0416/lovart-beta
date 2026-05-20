import { NextRequest, NextResponse } from 'next/server';
import { createPromptTemplate, getAllPromptTemplates, likePromptTemplate, deletePromptTemplate } from '@/lib/analytics';

export async function GET() {
  try {
    const templates = await getAllPromptTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[Prompt Templates API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch prompt templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, author } = body;
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    const template = await createPromptTemplate({ 
      content: content.trim(), 
      author: author?.trim() || undefined 
    });
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('[Prompt Templates API] Error:', error);
    return NextResponse.json({ error: 'Failed to create prompt template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    if (action === 'like') {
      await likePromptTemplate(id);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Prompt Templates API] Error:', error);
    return NextResponse.json({ error: 'Failed to update prompt template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    await deletePromptTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Prompt Templates API] Error:', error);
    return NextResponse.json({ error: 'Failed to delete prompt template' }, { status: 500 });
  }
}
