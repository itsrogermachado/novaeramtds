import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateOperatorRequest {
  email: string;
  password: string;
  fullName: string;
  nickname?: string;
  teamName?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to identify the manager
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's token to get manager ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the manager is authenticated
    const { data: { user: manager }, error: authError } = await userClient.auth.getUser();
    if (authError || !manager) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body
    const { email, password, fullName, nickname, teamName }: CreateOperatorRequest = await req.json();

    // Validate inputs
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Email, senha e nome são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if email is already in use
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Este email já está cadastrado no sistema" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create the new user account
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm email since manager is creating
      user_metadata: {
        full_name: fullName.trim(),
      },
    });

    if (createError || !newUser.user) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError?.message || "Erro ao criar usuário" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Add team member relationship
    const { error: teamError } = await adminClient
      .from("team_members")
      .insert({
        manager_id: manager.id,
        operator_id: newUser.user.id,
        nickname: nickname?.trim() || null,
        team_name: teamName?.trim() || "Meu Time",
      });

    if (teamError) {
      console.error("Error creating team member:", teamError);
      // Try to clean up the created user
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: "Erro ao adicionar operador ao time" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        operator: {
          id: newUser.user.id,
          email: newUser.user.email,
          fullName: fullName.trim(),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in create-team-operator:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
