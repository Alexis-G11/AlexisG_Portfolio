const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const whatsappConfigured =
    !!Deno.env.get('WHATSAPP_ACCESS_TOKEN') &&
    !!Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') &&
    !!Deno.env.get('WHATSAPP_RECIPIENT') &&
    !!Deno.env.get('WHATSAPP_TEMPLATE_NAME') &&
    !!Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE');
  const supabaseConfigured =
    !!Deno.env.get('SUPABASE_URL') && !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  return new Response(
    JSON.stringify({
      status: 'ok',
      services: {
        database: supabaseConfigured,
        whatsapp: whatsappConfigured,
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
