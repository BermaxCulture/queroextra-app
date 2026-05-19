import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Avatar,
  Button,
  useToast,
} from '@/components/ui'
import {
  Star,
  Camera,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Save,
  X,
  Plus,
} from 'lucide-react'

interface Review {
  id: string
  nota: number
  comentario: string | null
  created_at: string
  jobs: {
    titulo: string
  } | null
  avaliador: {
    nome: string
    avatar_url: string | null
  } | null
}

interface ProfileData {
  id: string
  nome: string | null
  email: string | null
  avatar_url: string | null
  celular: string | null
  freelancers: {
    id: string
    habilidades: string[] | null
    bio: string | null
  }[] | null
}

interface PerfilPageProps {
  customProfileId?: string
}

const ESPECIALIDADES_SUGERIDAS = [
  'Garçom',
  'Bartender',
  'Cozinha',
  'Copa',
  'Limpeza',
  'Churrasqueiro',
  'Recepcionista',
  'Caixa',
  'Auxiliar Geral',
]

export default function PerfilPage({ customProfileId }: PerfilPageProps) {
  const { user, signOut } = useAuth()
  const { id: paramId } = useParams<{ id?: string }>()
  const { showToast } = useToast()
  const navigate = useNavigate()

  // Determinar o ID do perfil a ser carregado
  const profileId = paramId || customProfileId || user?.id
  const isPrivate = !paramId && !customProfileId || paramId === user?.id

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)

  // Estados dos Dados do Perfil
  const [nome, setNome] = React.useState('')
  const [celular, setCelular] = React.useState('')
  const [bio, setBio] = React.useState('')
  const [avatarUrl, setAvatarUrl] = React.useState('')
  const [habilidades, setHabilidades] = React.useState<string[]>([])
  
  // Lista de avaliações e extras totais
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [totalExtras, setTotalExtras] = React.useState(0)
  const [mediaNota, setMediaNota] = React.useState(5.0)

  // Estados para edição temporária
  const [editNome, setEditNome] = React.useState('')
  const [editCelular, setEditCelular] = React.useState('')
  const [editBio, setEditBio] = React.useState('')
  const [editHabilidades, setEditHabilidades] = React.useState<string[]>([])
  const [novaHabilidade, setNovaHabilidade] = React.useState('')

  // Carregar dados do perfil
  const loadProfile = React.useCallback(async () => {
    if (!profileId) return
    try {
      setLoading(true)
      
      // 1. Carregar perfil e dados de freelancer
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, freelancers(*)')
        .eq('id', profileId)
        .single()

      if (profileError) throw profileError

      const prof = profileData as unknown as ProfileData
      setNome(prof.nome || '')
      setCelular(prof.celular || '')
      setAvatarUrl(prof.avatar_url || '')
      
      const free = prof.freelancers?.[0]
      setBio(free?.bio || '')
      setHabilidades(free?.habilidades || [])

      // 2. Carregar avaliações/reviews do freelancer (avaliado_id)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          nota,
          comentario,
          created_at,
          jobs (
            titulo
          ),
          avaliador:profiles!avaliador_id (
            nome,
            avatar_url
          )
        `)
        .eq('avaliado_id', profileId)
        .order('created_at', { ascending: false })

      if (reviewsError) throw reviewsError

      const revList = (reviewsData as unknown as Review[]) || []
      setReviews(revList)
      setTotalExtras(revList.length)

      if (revList.length > 0) {
        const sum = revList.reduce((acc, curr) => acc + curr.nota, 0)
        setMediaNota(parseFloat((sum / revList.length).toFixed(1)))
      } else {
        setMediaNota(5.0)
      }
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      console.error('Erro detalhado ao carregar perfil:', err)
      showToast(`Erro ao carregar perfil: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [profileId, showToast])

  React.useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Iniciar Modo de Edição
  const startEditing = () => {
    setEditNome(nome)
    setEditCelular(celular)
    setEditBio(bio)
    setEditHabilidades([...habilidades])
    setIsEditing(true)
  }

  // Cancelar Modo de Edição
  const cancelEditing = () => {
    setIsEditing(false)
  }

  // Alternar Habilidade na Edição
  const handleToggleHabilidade = (habilidade: string) => {
    setEditHabilidades((prev) =>
      prev.includes(habilidade)
        ? prev.filter((h) => h !== habilidade)
        : [...prev, habilidade]
    )
  }

  // Adicionar Habilidade Personalizada
  const handleAddHabilidadePersonalizada = () => {
    const value = novaHabilidade.trim()
    if (!value) return
    if (!editHabilidades.includes(value)) {
      setEditHabilidades((prev) => [...prev, value])
    }
    setNovaHabilidade('')
  }

  // Salvar Alterações de Perfil
  const saveProfile = async () => {
    if (!profileId) return
    try {
      setSaving(true)

      // 1. Atualizar profiles
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          nome: editNome,
          celular: editCelular,
        })
        .eq('id', profileId)

      if (profileUpdateError) throw profileUpdateError

      // 2. Atualizar ou criar freelancers
      const { data: freelancerCheck } = await supabase
        .from('freelancers')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle()

      if (freelancerCheck?.id) {
        const { error: freelancerUpdateError } = await supabase
          .from('freelancers')
          .update({
            bio: editBio,
            habilidades: editHabilidades,
          })
          .eq('profile_id', profileId)

        if (freelancerUpdateError) throw freelancerUpdateError
      } else {
        const { error: freelancerInsertError } = await supabase
          .from('freelancers')
          .insert({
            profile_id: profileId,
            bio: editBio,
            habilidades: editHabilidades,
          })

        if (freelancerInsertError) throw freelancerInsertError
      }

      // Atualizar estado local
      setNome(editNome)
      setCelular(editCelular)
      setBio(editBio)
      setHabilidades(editHabilidades)
      
      showToast('Perfil atualizado com sucesso!', 'success')
      setIsEditing(false)
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      console.error('Erro detalhado ao salvar perfil:', err)
      showToast(`Erro ao salvar perfil: ${msg}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Upload de Foto de Perfil para o Bucket
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profileId) return

    try {
      setSaving(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${profileId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Fazer upload para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Atualizar no profiles
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profileId)

      if (updateProfileError) throw updateProfileError

      setAvatarUrl(publicUrl)
      showToast('Foto de perfil atualizada!', 'success')
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      console.error('Erro detalhado no upload da foto:', err)
      showToast(`Erro no upload da imagem: ${msg}. Verifique se o bucket "avatars" existe no Supabase.`, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-qe-bg-page">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qe-yellow"></div>
      </div>
    )
  }

  return (
    <div className="pb-28 bg-qe-bg-page min-h-screen">
      {/* Header / Barra Superior */}
      {!isPrivate && (
        <header className="bg-white border-b border-qe-gray-100 px-4 md:px-8 py-4 sticky top-0 z-10 flex items-center gap-3 shadow-qe-sm">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-qe-gray-50 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-qe-gray-700" />
          </button>
          <span className="font-bold text-[17px] text-qe-gray-900">Perfil Profissional</span>
        </header>
      )}

      {/* VIEW PRINCIPAL DE PERFIL */}
      {!isEditing ? (
        <div className="space-y-6">
          {/* Banner de Topo com Avatar Centralizado */}
          <div className="relative">
            <div className="h-28 bg-qe-yellow-subtle w-full"></div>
            <div className="flex flex-col items-center -mt-14 px-4 text-center space-y-3">
              <div className="relative">
                <Avatar
                  src={avatarUrl}
                  name={nome || 'Freelancer'}
                  size="xl"
                  className="ring-4 ring-white shadow-qe-md"
                />
              </div>
              <div>
                <h2 className="text-h2 font-bold text-qe-gray-955 flex items-center justify-center gap-1">
                  {nome || 'Freelancer'}
                </h2>
                {/* Nota e Avaliações */}
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <div className="flex items-center gap-0.5 text-qe-yellow font-bold text-[14px]">
                    <Star className="w-4 h-4 fill-qe-yellow text-qe-yellow shrink-0" />
                    <span>{mediaNota.toFixed(1)}</span>
                  </div>
                  <span className="text-qe-gray-300 text-[12px] font-bold">·</span>
                  <span className="text-[12px] text-qe-gray-400 font-medium">
                    ({totalExtras} {totalExtras === 1 ? 'extra realizado' : 'extras realizados'})
                  </span>
                </div>
              </div>

              {isPrivate && (
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="font-semibold text-[13px] px-5" onClick={startEditing}>
                    Editar Perfil
                  </Button>
                  <Button variant="secondary" size="sm" className="font-semibold text-[13px]" onClick={signOut}>
                    Sair
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Coluna Esquerda: Sobre mim e Habilidades */}
              <div className="md:col-span-5 space-y-6">
                {/* Bio / Resumo */}
                <div className="bg-white border border-qe-gray-200 rounded-qe-md p-5 space-y-3 shadow-qe-sm">
                  <h3 className="text-[14px] font-bold text-qe-gray-950 uppercase tracking-[0.5px]">Sobre mim</h3>
                  <p className="text-[14px] text-qe-gray-600 leading-relaxed font-normal whitespace-pre-line">
                    {bio || 'Este freelancer ainda não adicionou um resumo profissional.'}
                  </p>
                </div>

                {/* Habilidades / Especialidades */}
                <div className="bg-white border border-qe-gray-200 rounded-qe-md p-5 space-y-3 shadow-qe-sm">
                  <h3 className="text-[14px] font-bold text-qe-gray-955 uppercase tracking-[0.5px]">Especialidades</h3>
                  {habilidades.length === 0 ? (
                    <p className="text-[13px] text-qe-gray-400 font-medium">Nenhuma especialidade definida.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {habilidades.map((habil) => (
                        <span
                          key={habil}
                          className="px-3 py-1 rounded-qe-pill text-[12px] font-bold tracking-[0.2px] bg-qe-gray-50 border border-qe-gray-200 text-qe-gray-700"
                        >
                          {habil}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Direita: Métricas e Avaliações */}
              <div className="md:col-span-7 space-y-6">
                {/* Cards de Métricas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-qe-gray-200 rounded-qe-md p-4 flex flex-col justify-between space-y-2 shadow-qe-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">Taxa de Resposta</span>
                      <TrendingUp className="w-4 h-4 text-qe-success shrink-0" />
                    </div>
                    <div>
                      <div className="text-[24px] font-bold text-qe-gray-955">98%</div>
                      <p className="text-[10px] text-qe-gray-400 font-medium mt-0.5">Alto engajamento</p>
                    </div>
                  </div>

                  <div className="bg-white border border-qe-gray-200 rounded-qe-md p-4 flex flex-col justify-between space-y-2 shadow-qe-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">Tempo Médio</span>
                      <Clock className="w-4 h-4 text-qe-yellow shrink-0" />
                    </div>
                    <div>
                      <div className="text-[24px] font-bold text-qe-gray-955">15 min</div>
                      <p className="text-[10px] text-qe-gray-400 font-medium mt-0.5">Retorno rápido</p>
                    </div>
                  </div>
                </div>

                {/* Avaliações Recentes */}
                <div className="bg-white border border-qe-gray-200 rounded-qe-md p-5 space-y-4 shadow-qe-sm">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[14px] font-bold text-qe-gray-955 uppercase tracking-[0.5px]">Avaliações Recentes</h3>
                    <span className="text-[12px] font-bold text-qe-gray-300">({reviews.length})</span>
                  </div>

                  {reviews.length === 0 ? (
                    <p className="text-[13px] text-qe-gray-400 font-medium py-2">Nenhuma avaliação recebida ainda.</p>
                  ) : (
                    <div className="space-y-4 divide-y divide-qe-gray-100">
                      {reviews.slice(0, 3).map((rev) => (
                        <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Avatar
                                src={rev.avaliador?.avatar_url || ''}
                                name={rev.avaliador?.nome || 'Contratante'}
                                size="sm"
                              />
                              <div>
                                <h4 className="text-[13px] font-bold text-qe-gray-955 leading-snug">
                                  {rev.avaliador?.nome || 'Contratante'}
                                </h4>
                                <p className="text-[11px] text-qe-gray-400 font-medium mt-0.5">
                                  {rev.jobs?.titulo || 'Trabalho Extra'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 text-qe-yellow text-[12px] font-bold">
                              <Star className="w-3.5 h-3.5 fill-qe-yellow text-qe-yellow shrink-0" />
                              <span>{rev.nota}</span>
                            </div>
                          </div>
                          {rev.comentario && (
                            <p className="text-[13px] text-qe-gray-600 leading-normal pl-9 font-normal">
                              "{rev.comentario}"
                            </p>
                          )}
                          <div className="text-[10px] text-qe-gray-300 text-right">
                            {new Date(rev.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      ))}
                      
                      {reviews.length > 3 && (
                        <Button variant="ghost" className="w-full text-[13px] font-semibold flex items-center justify-center gap-1 mt-2">
                          Ver todas as avaliações
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TELA DE EDIÇÃO DE PERFIL */
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
          <div className="flex items-center justify-between border-b border-qe-gray-100 pb-4">
            <h2 className="text-[20px] font-bold text-qe-gray-900">Editar Perfil</h2>
            <button
              onClick={cancelEditing}
              className="p-1.5 hover:bg-qe-gray-50 rounded-full transition-colors text-qe-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Esquerda: Foto e Dados Básicos */}
            <div className="space-y-6">
              {/* Upload de Foto */}
              <div className="bg-white border border-qe-gray-200 rounded-qe-md p-5 flex flex-col items-center space-y-4 shadow-qe-sm">
                <h3 className="text-[13px] font-bold text-qe-gray-955 uppercase tracking-[0.5px]">Foto de Perfil</h3>
                <div className="relative">
                  <Avatar
                    src={avatarUrl}
                    name={nome}
                    size="xl"
                    className="shadow-qe-sm"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-qe-yellow rounded-full border-2 border-white flex items-center justify-center cursor-pointer shadow-qe-md hover:bg-qe-yellow-text transition-colors"
                  >
                    <Camera className="w-4 h-4 text-qe-navy" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={saving}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-qe-gray-400 font-medium text-center">
                  Recomendado: imagem quadrada de até 5MB.
                </p>
              </div>

              {/* Campos Básicos */}
              <div className="bg-white border border-qe-gray-200 rounded-qe-md p-5 space-y-4 shadow-qe-sm">
                <h3 className="text-[13px] font-bold text-qe-gray-955 uppercase tracking-[0.5px]">Dados Principais</h3>
                
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-qe-gray-500">Nome Completo</label>
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    disabled={saving}
                    className="w-full h-11 border border-qe-gray-200 rounded-qe-sm px-3 text-[14px] focus:outline-none focus:border-qe-yellow transition-colors"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-qe-gray-500">Celular</label>
                  <input
                    type="tel"
                    value={editCelular}
                    onChange={(e) => setEditCelular(e.target.value)}
                    disabled={saving}
                    className="w-full h-11 border border-qe-gray-200 rounded-qe-sm px-3 text-[14px] focus:outline-none focus:border-qe-yellow transition-colors"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Direita: Bio e Especialidades */}
            <div className="space-y-6">
              {/* Bio */}
              <div className="bg-white border border-qe-gray-200 rounded-qe-md p-5 space-y-2 shadow-qe-sm">
                <h3 className="text-[13px] font-bold text-qe-gray-955 uppercase tracking-[0.5px]">Resumo Profissional (Bio)</h3>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  disabled={saving}
                  rows={5}
                  className="w-full border border-qe-gray-200 rounded-qe-sm p-3 text-[14px] focus:outline-none focus:border-qe-yellow transition-colors resize-none leading-relaxed"
                  placeholder="Descreva suas experiências, cursos e o que você busca nos trabalhos extras..."
                />
              </div>

              {/* Especialidades */}
              <div className="bg-white border border-qe-gray-200 rounded-qe-md p-5 space-y-4 shadow-qe-sm">
                <h3 className="text-[13px] font-bold text-qe-gray-955 uppercase tracking-[0.5px]">Habilidades & Especialidades</h3>
                
                {/* Habilidades ativas */}
                <div className="flex flex-wrap gap-2">
                  {editHabilidades.map((habil) => (
                    <span
                      key={habil}
                      onClick={() => handleToggleHabilidade(habil)}
                      className="px-3 py-1 rounded-qe-pill text-[12px] font-bold tracking-[0.2px] bg-qe-yellow-subtle border border-qe-yellow text-qe-yellow-text flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                    >
                      {habil}
                      <X className="w-3.5 h-3.5" />
                    </span>
                  ))}
                </div>

                {/* Habilidades sugeridas */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px] block">Escolha as que possui</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ESPECIALIDADES_SUGERIDAS.filter((h) => !editHabilidades.includes(h)).map((habil) => (
                      <span
                        key={habil}
                        onClick={() => handleToggleHabilidade(habil)}
                        className="px-2.5 py-0.5 rounded-qe-pill text-[11px] font-semibold bg-qe-gray-50 border border-qe-gray-200 text-qe-gray-600 hover:bg-qe-yellow-subtle hover:border-qe-yellow hover:text-qe-yellow-text cursor-pointer transition-colors"
                      >
                        + {habil}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Adicionar personalizada */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novaHabilidade}
                    onChange={(e) => setNovaHabilidade(e.target.value)}
                    disabled={saving}
                    className="flex-1 h-9 border border-qe-gray-200 rounded-qe-sm px-3 text-[12px] focus:outline-none focus:border-qe-yellow transition-colors"
                    placeholder="Outra especialidade..."
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 px-3 flex items-center justify-center shrink-0 cursor-pointer"
                    onClick={handleAddHabilidadePersonalizada}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Ações de Edição */}
          <div className="flex gap-3 max-w-md mx-auto md:max-w-none md:justify-end pt-4">
            <Button
              variant="secondary"
              className="flex-1 md:flex-initial md:w-36 font-semibold"
              onClick={cancelEditing}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1 md:flex-initial md:w-36 font-semibold flex items-center justify-center gap-1.5"
              onClick={saveProfile}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
