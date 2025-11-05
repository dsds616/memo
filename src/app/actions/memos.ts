'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from '@/lib/supabase/server'
import { Memo, MemoFormData } from '@/types/memo'
import { Database } from '@/types/database'
import { revalidatePath } from 'next/cache'

const supabase = createServerClient()

type MemoRow = Database['public']['Tables']['memos']['Row']

export async function getMemos(): Promise<Memo[]> {
  try {
    const { data, error } = await ((supabase as any)
      .from('memos')
      .select('id, title, content, category, tags, created_at, updated_at')
      .order('created_at', { ascending: false }))

    if (error) {
      console.error('Error fetching memos:', error)
      throw error
    }

    if (!data) return []

    // Transform database fields to match Memo interface
    return (data as MemoRow[]).map((memo) => ({
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags ?? [],
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
    const { data, error } = await ((supabase as any)
      .from('memos')
      .select('id, title, content, category, tags, created_at, updated_at')
      .eq('id', id)
      .single())

    if (error) {
      console.error('Error fetching memo:', error)
      return null
    }

    if (!data) return null

    const memo = data as MemoRow
    return {
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags ?? [],
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
    }
  } catch (error) {
    console.error('Failed to fetch memo:', error)
    return null
  }
}

export async function createMemo(formData: MemoFormData): Promise<Memo | null> {
  try {
    const insertData = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags || [],
    }

    const { data, error } = await ((supabase as any)
      .from('memos')
      .insert(insertData)
      .select('id, title, content, category, tags, created_at, updated_at')
      .single())

    if (error) {
      console.error('Error creating memo:', error)
      throw error
    }

    if (!data) return null

    const memo = data as MemoRow
    const result: Memo = {
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags ?? [],
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
    }

    revalidatePath('/')
    return result
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
    const updateData = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags || [],
    }

    const { data, error } = await ((supabase as any)
      .from('memos')
      .update(updateData)
      .eq('id', id)
      .select('id, title, content, category, tags, created_at, updated_at')
      .single())

    if (error) {
      console.error('Error updating memo:', error)
      throw error
    }

    if (!data) return null

    const memo = data as MemoRow
    const result: Memo = {
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags ?? [],
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
    }

    revalidatePath('/')
    return result
  } catch (error) {
    console.error('Failed to update memo:', error)
    return null
  }
}

export async function deleteMemo(id: string): Promise<boolean> {
  try {
    const { error } = await ((supabase as any).from('memos').delete().eq('id', id))

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
    const { data, error } = await ((supabase as any)
      .from('memos')
      .select('id, title, content, category, tags, created_at, updated_at')
      .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
      .order('created_at', { ascending: false }))

    if (error) {
      console.error('Error searching memos:', error)
      throw error
    }

    if (!data) return []

    // Filter by tags manually since array contains search is complex
    const filteredData = (data as MemoRow[]).filter((memo) => {
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
      tags: memo.tags ?? [],
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
    let query = ((supabase as any)
      .from('memos')
      .select('id, title, content, category, tags, created_at, updated_at')
      .order('created_at', { ascending: false }))

    if (category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching memos by category:', error)
      throw error
    }

    if (!data) return []

    return (data as MemoRow[]).map((memo) => ({
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags ?? [],
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
    }))
  } catch (error) {
    console.error('Failed to fetch memos by category:', error)
    return []
  }
}

