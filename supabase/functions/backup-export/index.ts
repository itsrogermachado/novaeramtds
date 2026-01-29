import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas admins podem exportar.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch all tables data
    const [
      profiles,
      userRoles,
      userMemberships,
      operations,
      operationMethods,
      expenses,
      expenseCategories,
      goals,
      dutchingHistory,
      tutorials,
      tutorialLinks,
      methodCategories,
      methodPosts,
      methodLinks
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('user_memberships').select('*'),
      supabase.from('operations').select('*'),
      supabase.from('operation_methods').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('expense_categories').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('dutching_history').select('*'),
      supabase.from('tutorials').select('*'),
      supabase.from('tutorial_links').select('*'),
      supabase.from('method_categories').select('*'),
      supabase.from('method_posts').select('*'),
      supabase.from('method_links').select('*'),
    ])

    // Fetch storage files from buckets
    const [tutorialsFiles, methodsFiles] = await Promise.all([
      supabase.storage.from('tutorials').list('', { limit: 1000 }),
      supabase.storage.from('methods').list('', { limit: 1000 }),
    ])

    // Get nested files for tutorials bucket
    const tutorialFolders = tutorialsFiles.data || []
    const tutorialStorageFiles: { folder: string; files: string[]; urls: string[] }[] = []
    
    for (const folder of tutorialFolders) {
      if (folder.id === null) { // It's a folder
        const { data: files } = await supabase.storage.from('tutorials').list(folder.name, { limit: 100 })
        if (files && files.length > 0) {
          const urls = files.map(f => 
            `${supabaseUrl}/storage/v1/object/public/tutorials/${folder.name}/${f.name}`
          )
          tutorialStorageFiles.push({
            folder: folder.name,
            files: files.map(f => f.name),
            urls
          })
        }
      }
    }

    // Get nested files for methods bucket
    const methodFolders = methodsFiles.data || []
    const methodStorageFiles: { folder: string; files: string[]; urls: string[] }[] = []
    
    for (const folder of methodFolders) {
      if (folder.id === null) { // It's a folder
        const { data: files } = await supabase.storage.from('methods').list(folder.name, { limit: 100 })
        if (files && files.length > 0) {
          const urls = files.map(f => 
            `${supabaseUrl}/storage/v1/object/public/methods/${folder.name}/${f.name}`
          )
          methodStorageFiles.push({
            folder: folder.name,
            files: files.map(f => f.name),
            urls
          })
        }
      }
    }

    const backup = {
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      tables: {
        profiles: profiles.data || [],
        user_roles: userRoles.data || [],
        user_memberships: userMemberships.data || [],
        operations: operations.data || [],
        operation_methods: operationMethods.data || [],
        expenses: expenses.data || [],
        expense_categories: expenseCategories.data || [],
        goals: goals.data || [],
        dutching_history: dutchingHistory.data || [],
        tutorials: tutorials.data || [],
        tutorial_links: tutorialLinks.data || [],
        method_categories: methodCategories.data || [],
        method_posts: methodPosts.data || [],
        method_links: methodLinks.data || [],
      },
      storage: {
        tutorials: tutorialStorageFiles,
        methods: methodStorageFiles,
      },
      counts: {
        profiles: profiles.data?.length || 0,
        user_roles: userRoles.data?.length || 0,
        user_memberships: userMemberships.data?.length || 0,
        operations: operations.data?.length || 0,
        operation_methods: operationMethods.data?.length || 0,
        expenses: expenses.data?.length || 0,
        expense_categories: expenseCategories.data?.length || 0,
        goals: goals.data?.length || 0,
        dutching_history: dutchingHistory.data?.length || 0,
        tutorials: tutorials.data?.length || 0,
        tutorial_links: tutorialLinks.data?.length || 0,
        method_categories: methodCategories.data?.length || 0,
        method_posts: methodPosts.data?.length || 0,
        method_links: methodLinks.data?.length || 0,
      }
    }

    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error: unknown) {
    console.error('Backup error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: 'Erro ao gerar backup', details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
