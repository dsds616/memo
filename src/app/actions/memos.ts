'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Memo, MemoFormData } from '@/types/memo'
import { revalidatePath } from 'next/cache'

const supabase = createServerClient()

export async function getMemos(): Promise<Memo[]> {
  try {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching memos:', error)
      throw error
    }

    // Transform database fields to match Memo interface
    return (data || []).map((memo) => ({
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags || [],
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
    }))
  } catch (error) {
    console.error('Failed to fetch memos:', error)
    return []
  }
}

export async function getMemoById(id: string): Promise<Memo | null> {
  try {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching memo:', error)
      return null
    }

    if (!data) return null

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error('Failed to fetch memo:', error)
    return null
  }
}

export async function createMemo(formData: MemoFormData): Promise<Memo | null> {
  try {
    const { data, error } = await supabase
      .from('memos')
      .insert({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating memo:', error)
      throw error
    }

    const memo: Memo = {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    revalidatePath('/')
    return memo
  } catch (error) {
    console.error('Failed to create memo:', error)
    return null
  }
}

export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo | null> {
  try {
    const { data, error } = await supabase
      .from('memos')
      .update({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags || [],
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating memo:', error)
      throw error
    }

    if (!data) return null

    const memo: Memo = {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    revalidatePath('/')
    return memo
  } catch (error) {
    console.error('Failed to update memo:', error)
    return null
  }
}

export async function deleteMemo(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('memos').delete().eq('id', id)

    if (error) {
      console.error('Error deleting memo:', error)
      throw error
    }

    revalidatePath('/')
    return true
  } catch (error) {
    console.error('Failed to delete memo:', error)
    return false
  }
}

export async function searchMemos(query: string): Promise<Memo[]> {
  try {
    const searchPattern = `%${query}%`
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching memos:', error)
      throw error
    }

    // Filter by tags manually since array contains search is complex
    const filteredData = (data || []).filter((memo) => {
      const matchesTitle = memo.title?.toLowerCase().includes(query.toLowerCase())
      const matchesContent = memo.content?.toLowerCase().includes(query.toLowerCase())
      const matchesTags = memo.tags?.some((tag: string) =>
        tag.toLowerCase().includes(query.toLowerCase())
      )
      return matchesTitle || matchesContent || matchesTags
    })

    return filteredData.map((memo) => ({
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags || [],
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
    }))
  } catch (error) {
    console.error('Failed to search memos:', error)
    return []
  }
}

export async function getMemosByCategory(category: string): Promise<Memo[]> {
  try {
    const query = supabase.from('memos').select('*').order('created_at', { ascending: false })

    if (category !== 'all') {
      query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching memos by category:', error)
      throw error
    }

    return (data || []).map((memo) => ({
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags || [],
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
    }))
  } catch (error) {
    console.error('Failed to fetch memos by category:', error)
    return []
  }
}

