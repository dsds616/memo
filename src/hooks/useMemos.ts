'use client'

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react'
import { Memo, MemoFormData } from '@/types/memo'
import {
  getMemos as getMemosAction,
  createMemo as createMemoAction,
  updateMemo as updateMemoAction,
  deleteMemo as deleteMemoAction,
  getMemoById as getMemoByIdAction,
} from '@/app/actions/memos'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isPending, startTransition] = useTransition()

  // 메모 로드
  useEffect(() => {
    const loadMemos = async () => {
      setLoading(true)
      try {
        const loadedMemos = await getMemosAction()
        setMemos(loadedMemos)
      } catch (error) {
        console.error('Failed to load memos:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMemos()
  }, [])

  // 메모 생성
  const createMemo = useCallback(
    async (formData: MemoFormData): Promise<Memo | null> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          try {
            const newMemo = await createMemoAction(formData)
            if (newMemo) {
              setMemos(prev => [newMemo, ...prev])
              resolve(newMemo)
            } else {
              resolve(null)
            }
          } catch (error) {
            console.error('Failed to create memo:', error)
            resolve(null)
          }
        })
      })
    },
    []
  )

  // 메모 업데이트
  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<void> => {
      startTransition(async () => {
        try {
          const updatedMemo = await updateMemoAction(id, formData)
          if (updatedMemo) {
            setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
          }
        } catch (error) {
          console.error('Failed to update memo:', error)
        }
      })
    },
    []
  )

  // 메모 삭제
  const deleteMemo = useCallback((id: string): void => {
    startTransition(async () => {
      try {
        const success = await deleteMemoAction(id)
        if (success) {
          setMemos(prev => prev.filter(memo => memo.id !== id))
        }
      } catch (error) {
        console.error('Failed to delete memo:', error)
      }
    })
  }, [])

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    async (id: string): Promise<Memo | undefined> => {
      // 먼저 로컬 상태에서 찾기
      const localMemo = memos.find(memo => memo.id === id)
      if (localMemo) return localMemo

      // 없으면 서버에서 가져오기
      try {
        const memo = await getMemoByIdAction(id)
        return memo || undefined
      } catch (error) {
        console.error('Failed to get memo:', error)
        return undefined
      }
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 모든 메모 삭제 (클라이언트에서만 필터 초기화)
  const clearAllMemos = useCallback((): void => {
    setSearchQuery('')
    setSelectedCategory('all')
  }, [])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading: loading || isPending,
    searchQuery,
    selectedCategory,
    stats,

    // 메모 CRUD
    createMemo,
    updateMemo,
    deleteMemo,
    getMemoById,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 유틸리티
    clearAllMemos,
  }
}
