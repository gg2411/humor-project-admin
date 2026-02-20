'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  totalImages: number
  totalCaptions: number
  totalVotes: number
  superadmins: number
  recentUsers: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalImages: 0,
    totalCaptions: 0,
    totalVotes: 0,
    superadmins: 0,
    recentUsers: 0
  })

  useEffect(() => {
    checkSuperadminAccess()
  }, [])

  async function checkSuperadminAccess() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email || '')

      // Check if user is superadmin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_superadmin')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.is_superadmin) {
        router.push('/unauthorized')
        return
      }

      setIsSuperadmin(true)
      await fetchStats()
      setLoading(false)
    } catch (err) {
      console.error('Error checking superadmin access:', err)
      router.push('/login')
    }
  }

  async function fetchStats() {
    try {
      // Fetch all statistics in parallel
      const [usersRes, imagesRes, captionsRes, votesRes, superadminsRes, recentUsersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('images').select('id', { count: 'exact', head: true }),
        supabase.from('captions').select('id', { count: 'exact', head: true }),
        supabase.from('caption_votes').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_superadmin', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ])

      setStats({
        totalUsers: usersRes.count || 0,
        totalImages: imagesRes.count || 0,
        totalCaptions: captionsRes.count || 0,
        totalVotes: votesRes.count || 0,
        superadmins: superadminsRes.count || 0,
        recentUsers: recentUsersRes.count || 0
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isSuperadmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Total Images"
            value={stats.totalImages}
            icon="🖼️"
            color="green"
          />
          <StatCard
            title="Total Captions"
            value={stats.totalCaptions}
            icon="💬"
            color="purple"
          />
          <StatCard
            title="Total Votes"
            value={stats.totalVotes}
            icon="👍"
            color="yellow"
          />
          <StatCard
            title="Superadmins"
            value={stats.superadmins}
            icon="⭐"
            color="red"
          />
          <StatCard
            title="New Users (7 days)"
            value={stats.recentUsers}
            icon="📈"
            color="indigo"
          />
        </div>

        {/* Management Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ManagementCard
            title="Manage Users"
            description="View and manage user profiles and permissions"
            href="/admin/users"
            icon="👥"
          />
          <ManagementCard
            title="Manage Images"
            description="View and moderate uploaded images"
            href="/admin/images"
            icon="🖼️"
          />
          <ManagementCard
            title="Manage Captions"
            description="View and edit generated captions"
            href="/admin/captions"
            icon="💬"
          />
          <ManagementCard
            title="Manage Humor Flavors"
            description="Create and edit humor flavors and their steps"
            href="/admin/humor-flavors"
            icon="🎭"
          />
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
        </div>
        <div className={`${colorClasses[color]} text-white text-4xl p-4 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function ManagementCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: string }) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </Link>
  )
}
