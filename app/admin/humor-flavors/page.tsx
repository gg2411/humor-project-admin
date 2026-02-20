'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface HumorFlavor {
  id: string
  name: string
  description: string
  created_at: string
}

interface FlavorStep {
  id: string
  flavor_id: string
  step_number: number
  instruction: string
  created_at: string
}

export default function HumorFlavorsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [flavors, setFlavors] = useState<HumorFlavor[]>([])
  const [selectedFlavor, setSelectedFlavor] = useState<HumorFlavor | null>(null)
  const [flavorSteps, setFlavorSteps] = useState<FlavorStep[]>([])

  // Form states
  const [showFlavorForm, setShowFlavorForm] = useState(false)
  const [showStepForm, setShowStepForm] = useState(false)
  const [flavorName, setFlavorName] = useState('')
  const [flavorDescription, setFlavorDescription] = useState('')
  const [stepNumber, setStepNumber] = useState(1)
  const [stepInstruction, setStepInstruction] = useState('')
  const [editingFlavor, setEditingFlavor] = useState<HumorFlavor | null>(null)
  const [editingStep, setEditingStep] = useState<FlavorStep | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_superadmin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_superadmin) {
      router.push('/unauthorized')
      return
    }

    await loadFlavors()
    setLoading(false)
  }

  async function loadFlavors() {
    const { data, error } = await supabase
      .from('humor_flavors')
      .select('*')
      .order('name')

    if (!error && data) {
      setFlavors(data)
    }
  }

  async function loadFlavorSteps(flavorId: string) {
    const { data, error } = await supabase
      .from('humor_flavor_steps')
      .select('*')
      .eq('flavor_id', flavorId)
      .order('step_number')

    if (!error && data) {
      setFlavorSteps(data)
    }
  }

  async function handleCreateFlavor() {
    if (!flavorName.trim()) return

    const { error } = await supabase
      .from('humor_flavors')
      .insert({
        name: flavorName,
        description: flavorDescription
      })

    if (!error) {
      setFlavorName('')
      setFlavorDescription('')
      setShowFlavorForm(false)
      await loadFlavors()
    }
  }

  async function handleUpdateFlavor() {
    if (!editingFlavor || !flavorName.trim()) return

    const { error } = await supabase
      .from('humor_flavors')
      .update({
        name: flavorName,
        description: flavorDescription
      })
      .eq('id', editingFlavor.id)

    if (!error) {
      setFlavorName('')
      setFlavorDescription('')
      setEditingFlavor(null)
      setShowFlavorForm(false)
      await loadFlavors()
    }
  }

  async function handleDeleteFlavor(id: string) {
    if (!confirm('Delete this flavor and all its steps?')) return

    await supabase.from('humor_flavor_steps').delete().eq('flavor_id', id)
    await supabase.from('humor_flavors').delete().eq('id', id)
    await loadFlavors()
    if (selectedFlavor?.id === id) {
      setSelectedFlavor(null)
      setFlavorSteps([])
    }
  }

  async function handleCreateStep() {
    if (!selectedFlavor || !stepInstruction.trim()) return

    const { error } = await supabase
      .from('humor_flavor_steps')
      .insert({
        flavor_id: selectedFlavor.id,
        step_number: stepNumber,
        instruction: stepInstruction
      })

    if (!error) {
      setStepNumber(stepNumber + 1)
      setStepInstruction('')
      setShowStepForm(false)
      await loadFlavorSteps(selectedFlavor.id)
    }
  }

  async function handleUpdateStep() {
    if (!editingStep || !stepInstruction.trim()) return

    const { error } = await supabase
      .from('humor_flavor_steps')
      .update({
        step_number: stepNumber,
        instruction: stepInstruction
      })
      .eq('id', editingStep.id)

    if (!error) {
      setStepInstruction('')
      setEditingStep(null)
      setShowStepForm(false)
      if (selectedFlavor) {
        await loadFlavorSteps(selectedFlavor.id)
      }
    }
  }

  async function handleDeleteStep(id: string) {
    if (!confirm('Delete this step?')) return

    await supabase.from('humor_flavor_steps').delete().eq('id', id)
    if (selectedFlavor) {
      await loadFlavorSteps(selectedFlavor.id)
    }
  }

  function startEditFlavor(flavor: HumorFlavor) {
    setEditingFlavor(flavor)
    setFlavorName(flavor.name)
    setFlavorDescription(flavor.description)
    setShowFlavorForm(true)
  }

  function startEditStep(step: FlavorStep) {
    setEditingStep(step)
    setStepNumber(step.step_number)
    setStepInstruction(step.instruction)
    setShowStepForm(true)
  }

  function selectFlavor(flavor: HumorFlavor) {
    setSelectedFlavor(flavor)
    loadFlavorSteps(flavor.id)
    setShowStepForm(false)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Manage Humor Flavors</h1>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Flavors Column */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Humor Flavors</h2>
              <button
                onClick={() => {
                  setEditingFlavor(null)
                  setFlavorName('')
                  setFlavorDescription('')
                  setShowFlavorForm(true)
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                + Add Flavor
              </button>
            </div>

            {showFlavorForm && (
              <div className="mb-4 p-4 border rounded bg-gray-50">
                <h3 className="font-bold mb-2">
                  {editingFlavor ? 'Edit Flavor' : 'New Flavor'}
                </h3>
                <input
                  type="text"
                  placeholder="Flavor name"
                  value={flavorName}
                  onChange={(e) => setFlavorName(e.target.value)}
                  className="w-full px-3 py-2 border rounded mb-2"
                />
                <textarea
                  placeholder="Description"
                  value={flavorDescription}
                  onChange={(e) => setFlavorDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded mb-2"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={editingFlavor ? handleUpdateFlavor : handleCreateFlavor}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  >
                    {editingFlavor ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowFlavorForm(false)
                      setEditingFlavor(null)
                      setFlavorName('')
                      setFlavorDescription('')
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {flavors.map((flavor) => (
                <div
                  key={flavor.id}
                  className={`p-4 border rounded cursor-pointer hover:bg-gray-50 ${
                    selectedFlavor?.id === flavor.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => selectFlavor(flavor)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold">{flavor.name}</h3>
                      <p className="text-sm text-gray-600">{flavor.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditFlavor(flavor)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFlavor(flavor.id)
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps Column */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedFlavor ? `Steps for "${selectedFlavor.name}"` : 'Select a Flavor'}
              </h2>
              {selectedFlavor && (
                <button
                  onClick={() => {
                    setEditingStep(null)
                    setStepNumber((flavorSteps.length || 0) + 1)
                    setStepInstruction('')
                    setShowStepForm(true)
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  + Add Step
                </button>
              )}
            </div>

            {!selectedFlavor && (
              <p className="text-gray-500 text-center py-8">
                Select a flavor from the left to view and manage its steps
              </p>
            )}

            {selectedFlavor && showStepForm && (
              <div className="mb-4 p-4 border rounded bg-gray-50">
                <h3 className="font-bold mb-2">
                  {editingStep ? 'Edit Step' : 'New Step'}
                </h3>
                <input
                  type="number"
                  placeholder="Step number"
                  value={stepNumber}
                  onChange={(e) => setStepNumber(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded mb-2"
                />
                <textarea
                  placeholder="Step instruction"
                  value={stepInstruction}
                  onChange={(e) => setStepInstruction(e.target.value)}
                  className="w-full px-3 py-2 border rounded mb-2"
                  rows={4}
                />
                <div className="flex gap-2">
                  <button
                    onClick={editingStep ? handleUpdateStep : handleCreateStep}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  >
                    {editingStep ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowStepForm(false)
                      setEditingStep(null)
                      setStepInstruction('')
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedFlavor && (
              <div className="space-y-2">
                {flavorSteps.map((step) => (
                  <div key={step.id} className="p-4 border rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold">
                            Step {step.step_number}
                          </span>
                        </div>
                        <p className="text-gray-700">{step.instruction}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => startEditStep(step)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
