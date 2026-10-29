const DEFAULTS = {
  site:{
    companyName:"株式会社 道東空調",
    heroTitle:"株式会社 道東空調",
    heroCopy:"換気ダクト・冷暖房・空調設備施工・製作・一般板金溶接。建物の快適な環境を、確かな技術で支えます。",
    sloganEn:"BREAK THROUGH THE SKY",
    sloganJp:"限界を超えて突き抜けろ！",
    address:"北海道河西郡芽室町東芽室北１線１６－１９",
    phone1:"0155-62-6600", phone2:"0155-34-6533",
    groupUrl:"https://sankyo-setsubi.jp/",
    businessSummary:"換気ダクト・冷暖房・空調設備施工・製作・一般板金溶接",
    companyTitle:"会社概要",
    companyLead1:"地域に根ざし、確かな技術と丁寧な仕事で、快適な空気環境を支えます。",
    companyLead2:"空調・換気・冷暖房設備の設計・施工からメンテナンスまで、建物に合わせた最適な設備をご提案します。",
    businessTitle:"事業内容",
    businessIntro:"設計・施工からメンテナンスまで、空調・換気設備のことなら株式会社道東空調にお任せください。",
    aboutTitle:"株式会社 道東空調について",
    aboutText:"私たちは、空調・換気設備のプロフェッショナルとして、人々が快適に過ごせる空間づくりに貢献します。お客様のニーズに寄り添い、安全・安心な設備環境をご提案します。",
    recruitCardTitle:"採用情報",
    recruitCardText:"一緒に働く仲間を募集しています。未経験の方も大歓迎です。",
    newsCardTitle:"お知らせ",
    newsCardText:"最新情報やお知らせをこちらでご案内します。",
    contactCardTitle:"お問い合わせ",
    contactCardText:"ご相談・お見積りなど、お気軽にお問い合わせください。",
    contactTitle:"空調・換気・冷暖房のご相談は、道東空調へ",
    contactIntro:"新設・更新・修理・メンテナンスなど、お気軽にご相談ください。",
    heroImageKey:"",
    businessCards:[
      {title:"換気ダクト",text:"建物用途や設備条件に合わせた換気ダクトの製作・施工に対応します。",imageKey:""},
      {title:"冷暖房・空調設備施工・製作",text:"快適な室内環境を支える冷暖房・空調設備の施工・製作を行います。",imageKey:""},
      {title:"一般板金溶接",text:"設備に関連する一般板金・溶接加工を、確かな技術で対応します。",imageKey:""}
    ]
  },
  profile:{rows:[{label:"会社名",value:"株式会社道東空調"},{label:"住所",value:"〒082-0004\n北海道河西郡芽室町東芽室北１線１６－１９"},{label:"電話",value:"0155-62-6600"},{label:"FAX",value:"0155-62-6622"}]},
  certificates:[],
  news:[{id:"n1",date:"2026-09-04",category:"お知らせ",title:"ホームページを公開しました。",body:"株式会社道東空調のホームページを公開しました。"}],
  works:[{id:"w1",title:"オフィス・店舗",type:"空調設備工事",summary:"空調設備・換気設備など、建物用途に合わせた施工を行います。",body:"オフィスや店舗などの建物に合わせて、空調・換気設備の施工を行います。",imageKey:""}],
  recruit:{title:"採用情報",lead:"見えないところで建物を支える。",jobs:"空調・換気設備施工スタッフ",description:"換気ダクト・冷暖房・空調設備の施工・製作、一般板金溶接など。",location:"河西郡芽室町東芽室北１線１６－１９",apply:"お電話またはお問い合わせフォームよりご連絡ください。"},
  contact:{title:"お問い合わせ",intro:"工事・設備・採用など、お気軽にお問い合わせください。",phone1:"0155-62-6600",phone2:"0155-34-6533",email:"n-nakayama@sankyo-setsubi.jp"}
};

const json = (data,status=200) => new Response(JSON.stringify(data),{
  status, headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
});
const authorized = (req,env) => {
  const expected = env.ADMIN_PASSWORD || "";
  return expected.length >= 6 && req.headers.get("x-admin-password") === expected;
};

async function cms(req, env, url) {
  if (!env.CMS) return json({error:"CMS_KV_not_bound"},500);

  if (url.searchParams.has("asset")) {
    const key = url.searchParams.get("asset");
    if (req.method === "GET") {
      const value = await env.CMS.get("asset:"+key, {type:"arrayBuffer"});
      if (!value) return new Response("Not found",{status:404});
      const meta = await env.CMS.get("assetmeta:"+key,{type:"json"});
      return new Response(value,{headers:{
        "content-type": meta?.contentType || "application/octet-stream",
        "cache-control":"no-store"
      }});
    }
    if (req.method === "DELETE") {
      if (!authorized(req,env)) return json({error:"unauthorized"},401);
      await Promise.all([env.CMS.delete("asset:"+key),env.CMS.delete("assetmeta:"+key)]);
      return json({ok:true});
    }
  }

  if (url.searchParams.has("assetUpload")) {
    if (!authorized(req,env)) return json({error:"unauthorized"},401);
    const fd = await req.formData();
    const file = fd.get("file"), key = String(fd.get("key")||"");
    if (!file || !key) return json({error:"file/key required"},400);
    if (file.size > 8*1024*1024) return json({error:"image too large"},400);
    await env.CMS.put("asset:"+key, await file.arrayBuffer());
    await env.CMS.put("assetmeta:"+key, JSON.stringify({contentType:file.type||"application/octet-stream"}));
    return json({ok:true,key});
  }

  const type = url.searchParams.get("type") || "";
  if (req.method === "POST" && type === "verify")
    return authorized(req,env) ? json({ok:true}) : json({error:"unauthorized"},401);

  if (!["site","news","works","recruit","contact","certificates","profile"].includes(type))
    return json({error:"invalid type"},400);

  if (req.method === "GET") {
    const raw = await env.CMS.get(type);
    if (!raw) return json(DEFAULTS[type]);
    const parsed = JSON.parse(raw);
    if (type === "site") {
      return json({
        ...DEFAULTS.site,
        ...parsed,
        businessCards: (parsed.businessCards && parsed.businessCards.length)
          ? parsed.businessCards
          : DEFAULTS.site.businessCards
      });
    }
    if (type === "news" && !authorized(req,env)) {
      const now = Date.now();
      return json((Array.isArray(parsed)?parsed:[]).filter(n=>{
        if(n.status === "draft") return false;
        if(n.status === "scheduled") {
          if(!n.publishAt) return false;
          const t=Date.parse(n.publishAt+":00+09:00");
          return Number.isFinite(t) && t<=now;
        }
        return true;
      }));
    }
    return json(parsed);
  }
  if (req.method === "PUT") {
    if (!authorized(req,env)) return json({error:"unauthorized"},401);
    await env.CMS.put(type, JSON.stringify(await req.json()));
    return json({ok:true});
  }
  return json({error:"method"},405);
}

async function contact(req, env) {
  if (req.method !== "POST") return json({error:"method"},405);
  const fd = await req.formData();
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: String(fd.get("name")||""),
    company: String(fd.get("company")||""),
    email: String(fd.get("email")||""),
    tel: String(fd.get("tel")||""),
    message: String(fd.get("message")||"")
  };
  if (!entry.name || !entry.email || !entry.message)
    return new Response("必須項目を入力してください。",{status:400});

  // Cloudflare KVに控えを保存
  if (env.CMS) await env.CMS.put("contact:"+entry.createdAt+":"+entry.id, JSON.stringify(entry), {expirationTtl: 60*60*24*90});

  // RESEND_API_KEYを設定した場合だけメール通知も送信
  if (env.RESEND_API_KEY) {
    const to = env.CONTACT_EMAIL || "n-nakayama@sankyo-setsubi.jp";
    const from = env.CONTACT_FROM || "onboarding@resend.dev";
    const body = [
      "株式会社道東空調HPからお問い合わせがありました。",
      "",
      "お名前: "+entry.name,
      "会社名: "+entry.company,
      "メール: "+entry.email,
      "電話番号: "+entry.tel,
      "",
      "お問い合わせ内容:",
      entry.message
    ].join("\n");
    await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"authorization":"Bearer "+env.RESEND_API_KEY,"content-type":"application/json"},
      body:JSON.stringify({from,to:[to],subject:"【道東空調HP】お問い合わせ",text:body,reply_to:entry.email})
    });
  }

  return Response.redirect(new URL("/thanks.html", req.url).toString(), 303);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/api/auth") {
      if (req.method !== "POST") return json({ok:false,error:"method_not_allowed"},405);
      let password = "";
      try { password = String((await req.json()).password||""); } catch {}
      if (!env.ADMIN_PASSWORD) return json({ok:false,error:"ADMIN_PASSWORD_not_set"},500);
      return password === env.ADMIN_PASSWORD ? json({ok:true}) : json({ok:false,error:"wrong_password"},401);
    }
    if (url.pathname === "/api/cms") return cms(req,env,url);
    if (url.pathname === "/api/contact") return contact(req,env);
    return env.ASSETS.fetch(req);
  }
};
