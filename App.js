// TextBrowser v10
// ✓ Fast: parallel fetch attempts, direct first
// ✓ Free AI (Pollinations.ai — no API key needed, like Copilot)
// ✓ All search links shown + pagination
// ✓ All sites work, zero JS garbage

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StatusBar, Modal,
  SafeAreaView, Platform, Keyboard,
} from 'react-native';

const IS_NATIVE = Platform.OS !== 'web';

// ── Quick Launch Categories ───────────────────────────────────
const CATEGORIES = [
  { id:'news', label:'📰 News', icon:'📰', sites:[
    ['BBC News','https://bbc.com/news'],
    ['Reuters','https://reuters.com'],
    ['CNN Lite','https://lite.cnn.com'],
    ['NPR News','https://text.npr.org'],
    ['AP News','https://apnews.com'],
    ['The Guardian','https://theguardian.com'],
    ['Al Jazeera','https://aljazeera.com'],
    ['Hacker News','https://news.ycombinator.com'],
  ]},
  { id:'selfhelp', label:'💪 Self-Help', icon:'💪', sites:[
    ['WikiHow','https://wikihow.com'],
    ['Tiny Buddha','https://tinybuddha.com'],
    ['James Clear','https://jamesclear.com/articles'],
    ['Mark Manson','https://markmanson.net'],
    ['Zen Habits','https://zenhabits.net'],
    ['Pick The Brain','https://pickthebrain.com'],
    ['Mind Tools','https://mindtools.com'],
    ['Verywell Mind','https://verywellmind.com'],
    ['Lifehacker','https://lifehacker.com'],
    ['Paul Graham','https://paulgraham.com/articles.html'],
  ]},
  { id:'nofap', label:'🛡 NoFap & Overcoming Lust', icon:'🛡', sites:[
    ['NoFap Official','https://nofap.com'],
    ['NoFap Forum','https://forum.nofap.com'],
    ['r/NoFap','https://old.reddit.com/r/NoFap'],
    ['r/Semenretention','https://old.reddit.com/r/Semenretention'],
    ['Fight the New Drug','https://fightthenewdrug.org'],
    ['Covenant Eyes Blog','https://covenanteyes.com/blog'],
    ['Your Brain on Porn','https://yourbrainonporn.com'],
    ['XXXchurch','https://xxxchurch.com'],
    ['Pure Desire','https://puredesire.org/resources'],
    ['Integrity Restored','https://integrityrestored.com'],
    ['Setting Captives Free','https://settingcaptivesfree.com'],
    ['Pure Life Ministries','https://purelifeministries.org'],
  ]},
  { id:'christian', label:'✝ Christian Faith', icon:'✝', sites:[
    ['Bible Gateway','https://biblegateway.com'],
    ['Bible Hub','https://biblehub.com'],
    ['Got Questions','https://gotquestions.org'],
    ['Desiring God','https://desiringgod.org'],
    ['The Gospel Coalition','https://thegospelcoalition.org'],
    ['Christianity Today','https://christianitytoday.com'],
    ['Crosswalk','https://crosswalk.com'],
    ['Ligonier Ministries','https://ligonier.org'],
    ['Grace to You','https://gty.org'],
    ['Christian Post','https://christianpost.com'],
    ['Revive Our Hearts','https://reviveourhearts.com'],
    ['Desiring God Articles','https://desiringgod.org/articles'],
  ]},
  { id:'prophecy', label:'🕊 End Times & Prophecy', icon:'🕊', sites:[
    ['Rapture Ready','https://raptureready.com'],
    ['End Times Headlines','https://endtimesheadlines.org'],
    ['Prophecy News Watch','https://prophecynewswatch.com'],
    ['Unsealed','https://unsealed.org'],
    ['Bible Prophecy Truth','https://bibleprophecytruth.com'],
    ['Signs of the Times','https://signsofthetimes.org.au'],
    ['End of American Dream','https://endoftheamericandream.com'],
    ['Before It\'s News','https://beforeitsnews.com/prophecy'],
  ]},
  { id:'testimony', label:'🌟 Testimonies (Heaven/Hell)', icon:'🌟', sites:[
    ['Sid Roth – It\'s Supernatural','https://sidroth.org'],
    ['CBN Testimonies','https://cbn.com/testimonies'],
    ['Heaven Testimony','https://heaventestimony.com'],
    ['Transformed Life','https://transformedlife.org'],
    ['Pure Life Ministries','https://purelifeministries.org'],
    ['IHOP – Testimonies','https://ihopkc.org'],
    ['Rick Renner','https://renner.org'],
    ['Life.Church','https://life.church/reads'],
    ['Testimony Search DDG','https://html.duckduckgo.com/html/?q=heaven+hell+testimony+christian'],
  ]},
  { id:'wiki', label:'📚 Reference & Knowledge', icon:'📚', sites:[
    ['Wikipedia','https://en.m.wikipedia.org/wiki/Main_Page'],
    ['Simple Wikipedia','https://simple.wikipedia.org/wiki/Main_Page'],
    ['WikiHow','https://wikihow.com'],
    ['Wikivoyage','https://en.m.wikivoyage.org/wiki/Main_Page'],
    ['Project Gutenberg','https://gutenberg.org'],
    ['Stack Overflow','https://stackoverflow.com'],
    ['Old Reddit','https://old.reddit.com'],
    ['Archive.org','https://archive.org'],
  ]},
];

// ── Colors ────────────────────────────────────────────────────
const C = {
  bg:'#202124', surface:'#292A2D', card:'#35363A', border:'#3C3D41',
  accent:'#8AB4F8', accentDim:'#1A2C4E', text:'#E8EAED', sub:'#9AA0A6',
  link:'#8AB4F8', linkVisited:'#C58AF9', linkBg:'#1A2840',
  danger:'#F28B82', warn:'#FDD663', green:'#81C995', divider:'#3C3D41',
};

// ── FETCH — race direct vs Jina for speed ────────────────────
// On native: race direct fetch vs Jina — whoever wins first
// On web: Jina first (no CORS on Jina), then proxies
async function fetchPage(url) {
  if (IS_NATIVE) {
    // Race: direct fetch vs Jina AI Reader simultaneously
    // Whichever responds first with valid content wins
    const direct = fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11) Chrome/120 Mobile Safari/537.36',
        'Accept': 'text/html,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }).then(async r => {
      if (!r.ok) throw new Error('direct:' + r.status);
      const t = await r.text();
      if (t.length < 100) throw new Error('direct:too short');
      return { content: t, mode: 'html' };
    });

    const jina = fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' },
    }).then(async r => {
      if (!r.ok) throw new Error('jina:' + r.status);
      const t = await r.text();
      if (t.length < 100) throw new Error('jina:too short');
      return { content: t, mode: 'jina' };
    });

    // Try both at once, take the first success
    try {
      return await Promise.any([direct, jina]);
    } catch (_) {}

    // Both failed — try corsproxy
    try {
      const r = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
      if (r.ok) { const t = await r.text(); if (t.length > 80) return { content: t, mode: 'html' }; }
    } catch (_) {}

    // Last resort: allorigins
    try {
      const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      if (r.ok) { const j = await r.json(); if (j.contents?.length > 80) return { content: j.contents, mode: 'html' }; }
    } catch (_) {}
  } else {
    // Web: Jina first (bypasses CORS)
    try {
      const r = await fetch(`https://r.jina.ai/${url}`, { headers: { 'Accept': 'text/plain' } });
      if (r.ok) { const t = await r.text(); if (t.length > 80) return { content: t, mode: 'jina' }; }
    } catch (_) {}
    try {
      const r = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
      if (r.ok) { const t = await r.text(); if (t.length > 80) return { content: t, mode: 'html' }; }
    } catch (_) {}
    try {
      const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      if (r.ok) { const j = await r.json(); if (j.contents?.length > 80) return { content: j.contents, mode: 'html' }; }
    } catch (_) {}
  }

  throw new Error('Could not load this page. Please check your internet connection.');
}

// ── Free AI — Pollinations.ai (no API key, no sign-up) ───────
async function askAI(messages, systemPrompt) {
  const res = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  });
  if (!res.ok) throw new Error('AI service error: ' + res.status);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || 'No response received.';
}

// ── HTML utilities ────────────────────────────────────────────
function ents(s) {
  if (!s) return '';
  return s
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/&apos;/g,"'").replace(/&mdash;/g,'—').replace(/&ndash;/g,'–')
    .replace(/&hellip;/g,'…').replace(/&copy;/g,'©').replace(/&reg;/g,'®')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));
}
function stripTags(h) {
  if (!h) return '';
  return ents(h
    .replace(/<br\s*\/?>/gi,'\n')
    .replace(/<\/(?:p|div|tr|li|section|article|h[1-6]|blockquote|td|th)>/gi,'\n')
    .replace(/<[^>]+>/g,''));
}
function isJunk(line) {
  const l = line.trim();
  if (!l || l.length < 2) return true;
  if (/^(var |let |const |function |if\s*\(|window\.|document\.|console\.|jQuery|\$\(|module\.|require\(|import |return |=>|\}\)|\}\);)/.test(l)) return true;
  if (/^[{}\[\];,()=><|&\\*^%@#~`\s]+$/.test(l)) return true;
  if (/^data:[a-z]/.test(l)) return true;
  return false;
}
function cleanLines(raw) {
  return raw.split('\n').map(l=>l.replace(/\t/g,' ').trim()).filter(l=>!isJunk(l))
    .join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
function resolveUrl(href, base) {
  if (!href) return null;
  const h = href.trim();
  if (!h || /^(javascript:|mailto:|tel:|data:|#)/i.test(h)) return null;
  if (/^https?:\/\//i.test(h)) return h;
  if (h.startsWith('//')) return 'https:'+h;
  try {
    const b = new URL(base);
    return h.startsWith('/') ? b.origin+h : b.origin+b.pathname.replace(/\/[^/]*$/,'/')+h;
  } catch { return null; }
}

// ── Parse Jina markdown ───────────────────────────────────────
function parseMarkdown(text) {
  const items=[], seen=new Set();
  const LINK=/\[([^\]]{1,300})\]\((https?:\/\/[^)\s]{1,600})\)/g;
  for (const rawLine of text.split('\n')) {
    const line=rawLine.trim();
    if (!line||isJunk(line)) continue;
    const hm=line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const c=hm[2].replace(LINK,'$1').replace(/[*_`]/g,'').trim();
      if (c) items.push({type:'heading',level:Math.min(hm[1].length,6),content:c});
      continue;
    }
    const target=line.replace(/^[-*•]\s+/,'');
    LINK.lastIndex=0;
    let last=0,lm,hasLink=false;
    while ((lm=LINK.exec(target))!==null) {
      hasLink=true;
      const before=target.slice(last,lm.index).replace(/[*_`]/g,'').trim();
      if (before.length>2&&!isJunk(before)) items.push({type:'text',content:before});
      const key=lm[1]+lm[2];
      if (!seen.has(key)) { seen.add(key); items.push({type:'link',content:lm[1].trim(),href:lm[2]}); }
      last=lm.index+lm[0].length;
    }
    const after=target.slice(last).replace(/[*_`]/g,'').trim();
    if (!hasLink) {
      const plain=target.replace(/[*_`#]/g,'').trim();
      if (plain.length>1&&!isJunk(plain)) items.push({type:'text',content:plain});
    } else if (after.length>2&&!isJunk(after)) {
      items.push({type:'text',content:after});
    }
  }
  return items;
}

// ── Parse HTML ────────────────────────────────────────────────
function parseHTML(rawHtml, baseUrl) {
  const html=rawHtml.length>600000?rawHtml.slice(0,600000):rawHtml;
  const clean=html
    .replace(/<(script|style|head|noscript|svg|canvas|nav|header|footer|aside|iframe|form)[\s\S]*?<\/\1>/gi,'')
    .replace(/<!--[\s\S]*?-->/g,'');
  const seen=new Set(), events=[];
  let m;
  const H=/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  while ((m=H.exec(clean))!==null) {
    const t=cleanLines(stripTags(m[2]));
    if (t&&t.length>1) events.push({pos:m.index,end:m.index+m[0].length,type:'heading',content:t,level:+m[1]});
  }
  const A=/<a\s[^>]*?href=["']([^"'\s>]{1,500})["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m=A.exec(clean))!==null) {
    const href=resolveUrl(m[1],baseUrl), t=cleanLines(stripTags(m[2])), k=(href||'')+t;
    if (href&&t&&t.length>1&&!seen.has(k)) { seen.add(k); events.push({pos:m.index,end:m.index+m[0].length,type:'link',content:t,href}); }
  }
  events.sort((a,b)=>a.pos-b.pos);
  const items=[]; let cur=0;
  for (const ev of events) {
    if (ev.pos<cur) continue;
    const txt=cleanLines(stripTags(clean.slice(cur,ev.pos)));
    if (txt.length>3) items.push({type:'text',content:txt});
    items.push(ev); cur=ev.end;
  }
  const tail=cleanLines(stripTags(clean.slice(cur)));
  if (tail.length>3) items.push({type:'text',content:tail});
  return items;
}

// ── DDG search parser ─────────────────────────────────────────
function parseDDG(html) {
  const results=[], seen=new Set();
  // Primary block extraction
  const BLOCK=/<div[^>]+class="[^"]*\bresults_links\b[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let bm;
  while ((bm=BLOCK.exec(html))!==null) {
    const block=bm[0];
    const tM=block.match(/<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!tM) continue;
    let href=tM[1];
    const uddg=href.match(/[?&]uddg=([^&]+)/);
    if (uddg) href=decodeURIComponent(uddg[1]);
    if (!/^https?:\/\//i.test(href)) href='https://'+href.replace(/^\//,'');
    const title=cleanLines(stripTags(tM[2]));
    if (!title||seen.has(href)) continue;
    seen.add(href);
    const snM=block.match(/class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|span|div)>/i);
    const snippet=snM?cleanLines(stripTags(snM[1])):'';
    const dM=block.match(/class="[^"]*result__url[^"]*"[^>]*>([\s\S]*?)<\/(?:a|span)>/i);
    const displayUrl=dM?stripTags(dM[1]).trim():'';
    results.push({title,href,snippet,displayUrl});
  }
  // Fallback: grab every result__a link
  if (results.length===0) {
    const A=/<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let am;
    while ((am=A.exec(html))!==null) {
      let href=am[1];
      const uddg=href.match(/[?&]uddg=([^&]+)/);
      if (uddg) href=decodeURIComponent(uddg[1]);
      if (!/^https?:\/\//i.test(href)) href='https://'+href.replace(/^\//,'');
      const title=cleanLines(stripTags(am[2]));
      if (!title||seen.has(href)) continue;
      seen.add(href); results.push({title,href,snippet:'',displayUrl:''});
    }
  }
  // Next page
  let nextUrl=null;
  const inputs={};
  const INP=/<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"/gi;
  let im;
  while ((im=INP.exec(html))!==null) inputs[im[1]]=im[2];
  if (inputs.s&&parseInt(inputs.s)>0) {
    const qs=Object.entries(inputs).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    nextUrl=`https://html.duckduckgo.com/html/?${qs}`;
  }
  return {results,nextUrl};
}

// ── Helpers ───────────────────────────────────────────────────
const host   = u=>{try{return new URL(u).hostname.replace(/^www\./,'');}catch{return u;}};
const ddgUrl = q=>`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
const isUrl  = t=>/^https?:\/\//i.test(t)||(/\.\w{2,}(\/|$)/.test(t)&&!t.includes(' '));
const http   = t=>/^https?:\/\//i.test(t)?t:'https://'+t;

// ── Selectable Text ───────────────────────────────────────────
const ST = ({style,children,lines})=>(
  <Text selectable selectionColor="#3D5A8A" style={style} numberOfLines={lines}>{children}</Text>
);

// ── Content items ─────────────────────────────────────────────
function Item({item,nav}) {
  if (item.type==='heading') {
    const fs=[22,18,16,15,14,13][item.level-1]??13;
    return <ST style={[st.h,{fontSize:fs}]}>{item.content}</ST>;
  }
  if (item.type==='link') return (
    <TouchableOpacity style={st.linkRow} onPress={()=>nav(item.href)} activeOpacity={0.7}>
      <ST style={st.linkT} lines={4}>{item.content}</ST>
    </TouchableOpacity>
  );
  return <ST style={st.body}>{item.content}</ST>;
}

function ResultCard({r,nav,wasVisited}) {
  return (
    <TouchableOpacity style={st.card} onPress={()=>nav(r.href)} activeOpacity={0.8}>
      <ST style={st.cardDomain} lines={1}>{r.displayUrl||host(r.href)}</ST>
      <ST style={[st.cardTitle,wasVisited&&{color:C.linkVisited}]}>{r.title}</ST>
      {!!r.snippet&&<ST style={st.cardSnip} lines={5}>{r.snippet}</ST>}
    </TouchableOpacity>
  );
}

function CatSection({cat,onPress,expanded,onToggle}) {
  const PREVIEW=4;
  const shown=expanded?cat.sites:cat.sites.slice(0,PREVIEW);
  return (
    <View style={st.catBox}>
      <TouchableOpacity style={st.catHead} onPress={onToggle} activeOpacity={0.7}>
        <Text style={st.catIcon}>{cat.icon}</Text>
        <Text style={st.catLabel}>{cat.label}</Text>
        <Text style={st.catChev}>{expanded?'▲':'▼'}</Text>
      </TouchableOpacity>
      <View style={st.catSites}>
        {shown.map(([label,url])=>(
          <TouchableOpacity key={label} style={st.catPill} onPress={()=>onPress(url)} activeOpacity={0.7}>
            <Text style={st.catPillT}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {cat.sites.length>PREVIEW&&(
        <TouchableOpacity style={st.catMore} onPress={onToggle}>
          <Text style={st.catMoreT}>{expanded?'Show less ▲':`+${cat.sites.length-PREVIEW} more sites ▼`}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── AI Modal — FREE, no API key (Pollinations.ai) ─────────────
function AIModal({visible,onClose,pageTitle,pageText}) {
  const [msgs,     setMsgs    ] = useState([]);
  const [input,    setInput   ] = useState('');
  const [thinking, setThinking] = useState(false);
  const aiRef = useRef(null);

  const sysPrompt = pageTitle
    ? `You are a helpful AI assistant inside a text browser app (like Copilot or ChatGPT). The user is currently reading a page titled "${pageTitle}". Here is the page content (first 1500 chars): ${(pageText||'').slice(0,1500)}. Answer concisely and helpfully. If asked about the page, use the content above.`
    : 'You are a helpful AI assistant inside a text browser app, similar to Microsoft Copilot or ChatGPT. Be concise, friendly, and helpful. Answer questions, explain topics, summarize content, and assist with anything the user needs.';

  const SUGGESTIONS = pageTitle
    ? ['Summarize this page','What are the key points?','Explain this simply','Give me a TL;DR']
    : ['What does the Bible say about lust?','How to overcome pornography addiction?','What is the Rapture?','Bible verses about strength','Tips to stay consistent on NoFap'];

  const send = async () => {
    const q=input.trim();
    if (!q||thinking) return;
    setInput('');
    const newMsgs=[...msgs,{role:'user',content:q}];
    setMsgs(newMsgs);
    setThinking(true);
    try {
      const reply = await askAI(newMsgs, sysPrompt);
      setMsgs(m=>[...m,{role:'assistant',content:reply}]);
    } catch(e) {
      setMsgs(m=>[...m,{role:'assistant',content:'Sorry, AI is temporarily unavailable. Please try again.'}]);
    } finally {
      setThinking(false);
      setTimeout(()=>aiRef.current?.scrollToEnd({animated:true}),150);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={ais.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.surface}/>
        {/* Header */}
        <View style={ais.header}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
            <View style={ais.aiDot}/>
            <View>
              <Text style={ais.headerTitle}>AI Assistant</Text>
              <Text style={ais.headerSub}>Free · No account needed</Text>
            </View>
          </View>
          <TouchableOpacity onPress={()=>{onClose();setMsgs([]);}} style={ais.closeBtn}>
            <Text style={{color:C.text,fontSize:16,fontWeight:'600'}}>✕</Text>
          </TouchableOpacity>
        </View>
        {!!pageTitle&&(
          <View style={ais.ctx}>
            <Text style={ais.ctxT} numberOfLines={1}>📄 Context: {pageTitle}</Text>
          </View>
        )}
        {/* Messages */}
        <ScrollView ref={aiRef} style={ais.msgs} contentContainerStyle={{padding:14,paddingBottom:20}} keyboardShouldPersistTaps="handled">
          {msgs.length===0&&(
            <View style={ais.welcome}>
              <View style={ais.welcomeIcon}><Text style={{color:'#fff',fontSize:22}}>✦</Text></View>
              <Text style={ais.welcomeTitle}>AI Assistant</Text>
              <Text style={ais.welcomeSub}>{pageTitle?`Ask me about "${pageTitle}" or anything else.`:'Ask me anything! I can help with questions, explanations, Bible topics, and more.'}</Text>
              <Text style={ais.sugLabel}>Try asking:</Text>
              {SUGGESTIONS.map(s=>(
                <TouchableOpacity key={s} style={ais.sug} onPress={()=>setInput(s)}>
                  <Text style={ais.sugT}>💬  {s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {msgs.map((m,i)=>(
            <View key={i} style={m.role==='user'?ais.userBubble:ais.botBubble}>
              {m.role==='assistant'&&(
                <View style={ais.botAvatar}><Text style={{color:'#fff',fontSize:11}}>✦</Text></View>
              )}
              <ST style={m.role==='user'?ais.userT:ais.botT}>{m.content}</ST>
            </View>
          ))}
          {thinking&&(
            <View style={ais.botBubble}>
              <View style={ais.botAvatar}><Text style={{color:'#fff',fontSize:11}}>✦</Text></View>
              <View style={ais.typingDots}>
                <ActivityIndicator size="small" color={C.accent}/>
                <Text style={{color:C.sub,fontSize:12,marginLeft:6}}>Thinking…</Text>
              </View>
            </View>
          )}
        </ScrollView>
        {/* Input */}
        <View style={ais.inputBar}>
          <TextInput
            style={ais.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            placeholder="Ask anything…"
            placeholderTextColor={C.sub}
            multiline
            blurOnSubmit
            returnKeyType="send"
          />
          <TouchableOpacity style={[ais.sendBtn,(!input.trim()||thinking)&&{opacity:.35}]} onPress={send} disabled={!input.trim()||thinking}>
            <Text style={{color:'#fff',fontSize:18,fontWeight:'700'}}>↑</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Data Panel ────────────────────────────────────────────────
function DataPanel({visible,onClose,tab,setTab,hist,setHist,bk,setBk,onNav}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={onClose}/>
      <View style={st.sheet}>
        <View style={{alignItems:'center',paddingTop:10}}><View style={st.handle}/></View>
        <View style={st.sheetHead}>
          <Text style={st.sheetTitle}>Browser Data</Text>
          <TouchableOpacity onPress={onClose}><Text style={st.sheetDone}>Done</Text></TouchableOpacity>
        </View>
        <View style={st.tabs}>
          {[['hist',`History (${hist.length})`],['bk',`Bookmarks (${bk.length})`]].map(([t,l])=>(
            <TouchableOpacity key={t} style={[st.tabBtn,tab===t&&st.tabOn]} onPress={()=>setTab(t)}>
              <Text style={[st.tabT,tab===t&&st.tabTOn]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView style={{flex:1}} keyboardShouldPersistTaps="handled">
          {tab==='hist'
            ? hist.length===0 ? <Text style={st.empty}>No history yet.</Text>
              : hist.map((x,i)=>(
                <TouchableOpacity key={i} style={st.row} onPress={()=>onNav(x.url)} activeOpacity={0.7}>
                  <Text style={{color:C.sub}}>🕐</Text>
                  <View style={{flex:1}}>
                    <ST style={st.rowT} lines={1}>{x.title}</ST>
                    <ST style={st.rowS} lines={1}>{host(x.url)}</ST>
                  </View>
                  <Text style={st.rowTs}>{x.ts}</Text>
                </TouchableOpacity>
              ))
            : bk.length===0 ? <Text style={st.empty}>No bookmarks yet.{'\n'}Tap ☆ on any page.</Text>
              : bk.map((x,i)=>(
                <TouchableOpacity key={i} style={st.row} onPress={()=>onNav(x.url)} activeOpacity={0.7}>
                  <Text style={{color:C.warn}}>★</Text>
                  <View style={{flex:1}}>
                    <ST style={st.rowT} lines={1}>{x.title}</ST>
                    <ST style={st.rowS} lines={1}>{host(x.url)}</ST>
                  </View>
                  <TouchableOpacity onPress={()=>setBk(b=>b.filter(b=>b.url!==x.url))} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                    <Text style={{color:C.danger,fontSize:14}}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
          }
        </ScrollView>
        {((tab==='hist'&&hist.length>0)||(tab==='bk'&&bk.length>0))&&(
          <TouchableOpacity style={st.clearBtn} onPress={()=>tab==='hist'?setHist([]):setBk([])}>
            <Text style={st.clearT}>Clear all {tab==='hist'?'history':'bookmarks'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [inp,         setInp        ] = useState('');
  const [items,       setItems      ] = useState([]);
  const [searchRes,   setSearchRes  ] = useState(null);
  const [busy,        setBusy       ] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [currentUrl,  setCurrentUrl ] = useState('');
  const [pageTitle,   setPageTitle  ] = useState('');
  const [pageText,    setPageText   ] = useState('');
  const [err,         setErr        ] = useState('');
  const [hist,        setHist       ] = useState([]);
  const [visited,     setVisited    ] = useState(new Set());
  const [bk,          setBk         ] = useState([]);
  const [panel,       setPanel      ] = useState(false);
  const [panelTab,    setPanelTab   ] = useState('hist');
  const [aiOpen,      setAiOpen     ] = useState(false);
  const [stack,       setStack      ] = useState([]);
  const [expanded,    setExpanded   ] = useState({});
  const scroll = useRef(null);

  const isHome = !currentUrl&&!busy&&items.length===0&&!searchRes&&!err;

  const addHistory = (u,t) => {
    const now=new Date();
    const ts=now.toLocaleDateString([],{month:'short',day:'numeric'})+' '+now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    setHist(h=>[{url:u,title:t||host(u),ts},...h.filter(x=>x.url!==u).slice(0,99)]);
    setVisited(v=>new Set([...v,u]));
  };

  const go = useCallback(async (raw, appendSearch=false) => {
    if (!raw?.trim()) return;
    Keyboard.dismiss();
    const q=raw.trim();
    const isSearch=!isUrl(q);
    const finalUrl=isSearch?ddgUrl(q):http(q);

    if (!appendSearch) {
      setBusy(true); setErr(''); setItems([]); setSearchRes(null);
      setCurrentUrl(finalUrl); setInp(isSearch?q:finalUrl);
      setStack(s=>[...s,finalUrl]);
      scroll.current?.scrollTo({y:0,animated:false});
      addHistory(finalUrl,isSearch?'Search: '+q:'');
    } else {
      setMoreLoading(true);
    }

    try {
      const {content,mode}=await fetchPage(finalUrl);
      const isDDG=finalUrl.includes('duckduckgo.com/html');

      if (isDDG&&mode!=='jina') {
        const parsed=parseDDG(content);
        if (appendSearch&&searchRes) {
          setSearchRes(prev=>({results:[...prev.results,...parsed.results],nextUrl:parsed.nextUrl}));
        } else {
          if (parsed.results.length>0) {
            setSearchRes(parsed);
            setPageTitle(isSearch?`"${q}" — Search`:' Results');
          } else {
            setItems(parseHTML(content,finalUrl));
            setPageTitle('Search Results'); setSearchRes(null);
          }
        }
        setPageText('');
      } else if (mode==='jina') {
        let title=host(finalUrl);
        for (const l of content.split('\n').slice(0,8)) {
          const m=l.match(/^(?:Title:|# )(.+)/);
          if (m){title=m[1].trim();break;}
        }
        setPageTitle(title);
        const parsed=parseMarkdown(content);
        setItems(parsed.length>0?parsed:[{type:'text',content:'Page loaded but no readable text found.'}]);
        setSearchRes(null);
        setPageText(parsed.filter(i=>i.type==='text').map(i=>i.content).join('\n').slice(0,3000));
      } else {
        const tm=content.match(/<title[^>]*>([^<]{1,120})<\/title>/i);
        const title=tm?ents(tm[1].trim()):host(finalUrl);
        setPageTitle(title);
        const parsed=parseHTML(content,finalUrl);
        setItems(parsed.length>0?parsed:[{type:'text',content:'No readable content found on this page.'}]);
        setSearchRes(null);
        setPageText(parsed.filter(i=>i.type==='text').map(i=>i.content).join('\n').slice(0,3000));
      }
    } catch(e) {
      if (!appendSearch) setErr(e.message||'Unknown error');
    } finally {
      setBusy(false); setMoreLoading(false);
    }
  },[searchRes]);

  const goBack=()=>{if(stack.length<=1)return;const s=stack.slice(0,-1);setStack(s);go(s[s.length-1]);};
  const reset=()=>{setItems([]);setCurrentUrl('');setInp('');setErr('');setPageTitle('');setPageText('');setStack([]);setSearchRes(null);};
  const starred=useMemo(()=>bk.some(b=>b.url===currentUrl),[bk,currentUrl]);
  const toggleStar=()=>{if(!currentUrl)return;starred?setBk(b=>b.filter(x=>x.url!==currentUrl)):setBk(b=>[{url:currentUrl,title:pageTitle||host(currentUrl)},...b]);};
  const toggleCat=(id)=>setExpanded(e=>({...e,[id]:!e[id]}));

  // ── HOME ──────────────────────────────────────────────────
  if (isHome) return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.surface}/>
      <View style={st.homeTop}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <View style={st.dot}/><Text style={st.appName}>TextBrowser</Text>
        </View>
        <View style={{flexDirection:'row',gap:6}}>
          <TouchableOpacity style={st.topBtn} onPress={()=>setAiOpen(true)}>
            <Text style={{color:C.accent,fontSize:15}}>✦</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.topBtn} onPress={()=>setPanel(true)}>
            <Text style={{color:C.text,fontSize:15}}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom:40}} keyboardShouldPersistTaps="handled">
        <View style={st.heroBox}>
          <Text style={st.heroTitle}>Search the web</Text>
          <View style={st.bigBar}>
            <Text style={{color:C.sub,fontSize:14,marginRight:8}}>🔍</Text>
            <TextInput
              style={st.bigBarIn}
              value={inp}
              onChangeText={setInp}
              onSubmitEditing={()=>inp.trim()&&go(inp.trim())}
              placeholder="Search or enter URL…"
              placeholderTextColor={C.sub}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
            />
            {inp.length>0&&(
              <TouchableOpacity onPress={()=>setInp('')} hitSlop={{top:10,bottom:10,left:8,right:8}}>
                <Text style={{color:C.sub,fontSize:14}}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={[st.goBtn,!inp.trim()&&{opacity:.35}]} onPress={()=>inp.trim()&&go(inp.trim())} disabled={!inp.trim()}>
            <Text style={st.goBtnT}>Search</Text>
          </TouchableOpacity>
        </View>

        {CATEGORIES.map(cat=>(
          <CatSection key={cat.id} cat={cat} onPress={go} expanded={!!expanded[cat.id]} onToggle={()=>toggleCat(cat.id)}/>
        ))}

        {hist.length>0&&(
          <View style={st.homeSection}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <Text style={st.secLbl}>RECENT</Text>
              <TouchableOpacity onPress={()=>setPanel(true)}><Text style={{color:C.accent,fontSize:11}}>See all</Text></TouchableOpacity>
            </View>
            {hist.slice(0,5).map((h,i)=>(
              <TouchableOpacity key={i} style={st.recRow} onPress={()=>go(h.url)} activeOpacity={0.7}>
                <Text style={{color:C.sub,fontSize:11,marginRight:8}}>🕐</Text>
                <ST style={st.recT} lines={1}>{h.title}</ST>
                <Text style={st.recTs}>{h.ts}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <AIModal visible={aiOpen} onClose={()=>setAiOpen(false)} pageTitle={null} pageText={null}/>
      <DataPanel visible={panel} onClose={()=>setPanel(false)} tab={panelTab} setTab={setPanelTab}
        hist={hist} setHist={setHist} bk={bk} setBk={setBk} onNav={u=>{setPanel(false);go(u);}}/>
    </SafeAreaView>
  );

  // ── BROWSER SCREEN ────────────────────────────────────────
  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <View style={st.topBar}>
        <TouchableOpacity style={[st.navBtn,stack.length<=1&&{opacity:.3}]} onPress={goBack} disabled={stack.length<=1}>
          <Text style={st.navBtnT}>‹</Text>
        </TouchableOpacity>
        <View style={st.urlBar}>
          <Text style={{fontSize:10,color:C.sub,marginRight:4}}>{/^https/i.test(currentUrl)?'🔒':'⚠'}</Text>
          <TextInput
            style={st.urlInput}
            value={inp}
            onChangeText={setInp}
            onSubmitEditing={()=>inp.trim()&&go(inp.trim())}
            placeholder="Search or enter URL"
            placeholderTextColor={C.sub}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            selectTextOnFocus
          />
          {busy
            ? <ActivityIndicator size="small" color={C.accent} style={{marginLeft:4}}/>
            : inp.length>0
              ? <TouchableOpacity onPress={()=>setInp('')} hitSlop={{top:8,bottom:8,left:4,right:4}}>
                  <Text style={{color:C.sub,fontSize:12}}>✕</Text>
                </TouchableOpacity>
              : null
          }
        </View>
        <TouchableOpacity style={st.navBtn} onPress={()=>setPanel(true)}>
          <Text style={[st.navBtnT,{fontSize:16,letterSpacing:-2}]}>⋮</Text>
        </TouchableOpacity>
      </View>

      {!!pageTitle&&(
        <View style={st.titleBar}>
          <ST style={st.titleBarT} lines={1}>{pageTitle}</ST>
        </View>
      )}

      <ScrollView ref={scroll} style={st.scroll} contentContainerStyle={st.scrollP} keyboardShouldPersistTaps="handled">
        {busy&&(
          <View style={st.centerBox}>
            <ActivityIndicator size="large" color={C.accent}/>
            <Text style={st.loadT}>Loading…</Text>
            <Text style={st.loadSub}>Fetching directly + via Jina AI Reader simultaneously</Text>
          </View>
        )}

        {!busy&&!!err&&(
          <View style={st.errBox}>
            <Text style={st.errTitle}>Unable to Load</Text>
            <ST style={st.errBody}>{err}</ST>
            <View style={{flexDirection:'row',gap:10,marginTop:14}}>
              <TouchableOpacity style={st.errBtn} onPress={()=>go(currentUrl)}>
                <Text style={st.errBtnT}>↻  Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.errBtn,{backgroundColor:C.accentDim,borderColor:C.accent}]} onPress={reset}>
                <Text style={[st.errBtnT,{color:C.accent}]}>⌂  Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!busy&&!err&&searchRes&&(
          <>
            <Text style={st.srHeader}>{searchRes.results.length} results found</Text>
            {searchRes.results.map((r,i)=>(
              <ResultCard key={i} r={r} nav={go} wasVisited={visited.has(r.href)}/>
            ))}
            {searchRes.nextUrl&&(
              <TouchableOpacity style={st.moreBtn} onPress={()=>go(searchRes.nextUrl,true)} disabled={moreLoading}>
                {moreLoading
                  ? <ActivityIndicator size="small" color={C.accent}/>
                  : <Text style={st.moreBtnT}>Load more results  ↓</Text>
                }
              </TouchableOpacity>
            )}
          </>
        )}

        {!busy&&!err&&!searchRes&&items.map((item,i)=>(
          <Item key={i} item={item} nav={go}/>
        ))}

        {!busy&&!err&&(items.length>0||searchRes)&&(
          <View style={st.eof}>
            <View style={st.eofLine}/>
            <TouchableOpacity onPress={()=>scroll.current?.scrollTo({y:0,animated:true})}>
              <Text style={st.eofBtn}>↑ Back to top</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={st.botBar}>
        {[
          {icon:'⌂',  label:'Home',    fn:reset,              dis:false,       gold:false},
          {icon:'↻',  label:'Refresh', fn:()=>go(currentUrl), dis:!currentUrl, gold:false},
          {icon:starred?'★':'☆', label:starred?'Saved':'Save', fn:toggleStar, dis:!currentUrl, gold:starred},
          {icon:'✦',  label:'AI',      fn:()=>setAiOpen(true),dis:false,       gold:false},
          {icon:'☰',  label:'History', fn:()=>setPanel(true), dis:false,       gold:false},
        ].map(({icon,label,fn,dis,gold})=>(
          <TouchableOpacity key={label} style={[st.botBtn,dis&&{opacity:.28}]} onPress={fn} disabled={dis}>
            <Text style={[st.botI,gold&&{color:C.warn}]}>{icon}</Text>
            <Text style={[st.botL,gold&&{color:C.warn}]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <AIModal visible={aiOpen} onClose={()=>setAiOpen(false)} pageTitle={pageTitle} pageText={pageText}/>
      <DataPanel visible={panel} onClose={()=>setPanel(false)} tab={panelTab} setTab={setPanelTab}
        hist={hist} setHist={setHist} bk={bk} setBk={setBk} onNav={u=>{setPanel(false);go(u);}}/>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const st = StyleSheet.create({
  root:    {flex:1,backgroundColor:C.bg},
  homeTop: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:11,backgroundColor:C.surface,borderBottomWidth:1,borderBottomColor:C.border},
  dot:     {width:8,height:8,borderRadius:4,backgroundColor:C.accent},
  appName: {color:C.text,fontSize:14,fontWeight:'700'},
  topBtn:  {padding:7,backgroundColor:C.card,borderRadius:8,borderWidth:1,borderColor:C.border},
  heroBox: {paddingHorizontal:16,paddingTop:18,paddingBottom:14},
  heroTitle:{color:C.text,fontSize:20,fontWeight:'800',marginBottom:14,letterSpacing:-0.3},
  bigBar:  {flexDirection:'row',alignItems:'center',backgroundColor:C.card,borderRadius:12,borderWidth:1.5,borderColor:C.accent,paddingHorizontal:12,height:48,marginBottom:10,elevation:3},
  bigBarIn:{flex:1,color:C.text,fontSize:14,paddingVertical:0},
  goBtn:   {backgroundColor:C.accent,borderRadius:10,paddingVertical:12,alignItems:'center'},
  goBtnT:  {color:'#fff',fontSize:14,fontWeight:'700'},
  catBox:  {marginHorizontal:14,marginBottom:8,backgroundColor:C.surface,borderRadius:12,borderWidth:1,borderColor:C.border,overflow:'hidden'},
  catHead: {flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingVertical:11,gap:8},
  catIcon: {fontSize:14},
  catLabel:{flex:1,color:C.text,fontSize:13,fontWeight:'600'},
  catChev: {color:C.sub,fontSize:11},
  catSites:{flexDirection:'row',flexWrap:'wrap',paddingHorizontal:10,paddingBottom:8,gap:7},
  catPill: {backgroundColor:C.card,borderRadius:14,paddingHorizontal:11,paddingVertical:6,borderWidth:1,borderColor:C.border},
  catPillT:{color:C.accent,fontSize:12},
  catMore: {paddingHorizontal:14,paddingBottom:10},
  catMoreT:{color:C.accent,fontSize:11},
  homeSection:{paddingHorizontal:16,marginTop:4,marginBottom:6},
  secLbl:  {color:C.sub,fontSize:9,letterSpacing:1.4,marginBottom:10},
  recRow:  {flexDirection:'row',alignItems:'center',paddingVertical:9,borderBottomWidth:1,borderBottomColor:C.divider},
  recT:    {flex:1,color:C.sub,fontSize:12},
  recTs:   {color:C.border,fontSize:10},
  topBar:  {flexDirection:'row',alignItems:'center',paddingHorizontal:8,paddingVertical:7,gap:5,backgroundColor:C.surface,borderBottomWidth:1,borderBottomColor:C.border},
  navBtn:  {width:34,height:34,borderRadius:6,alignItems:'center',justifyContent:'center'},
  navBtnT: {color:C.text,fontSize:22,lineHeight:26},
  urlBar:  {flex:1,height:36,flexDirection:'row',alignItems:'center',backgroundColor:C.card,borderRadius:20,paddingHorizontal:12,borderWidth:1,borderColor:C.border},
  urlInput:{flex:1,color:C.text,fontSize:12,paddingVertical:0},
  titleBar:{backgroundColor:C.surface,paddingHorizontal:14,paddingVertical:5,borderBottomWidth:1,borderBottomColor:C.border},
  titleBarT:{color:C.sub,fontSize:10},
  scroll:  {flex:1},
  scrollP: {padding:12,paddingBottom:30},
  centerBox:{alignItems:'center',paddingTop:70},
  loadT:   {color:C.sub,marginTop:14,fontSize:14},
  loadSub: {color:C.border,marginTop:5,fontSize:11,textAlign:'center',paddingHorizontal:30},
  errBox:  {marginTop:16,padding:16,backgroundColor:'#2D1515',borderRadius:12,borderWidth:1,borderColor:'#5C2020'},
  errTitle:{color:C.danger,fontSize:15,fontWeight:'700',marginBottom:8},
  errBody: {color:'#D08080',fontSize:12,lineHeight:19},
  errBtn:  {flex:1,alignItems:'center',backgroundColor:'#3D1A1A',borderRadius:8,paddingVertical:10,borderWidth:1,borderColor:C.danger},
  errBtnT: {color:C.danger,fontWeight:'600',fontSize:12},
  srHeader:{color:C.sub,fontSize:11,marginBottom:10,fontStyle:'italic'},
  card:    {backgroundColor:C.card,borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:C.border},
  cardDomain:{color:C.green,fontSize:10,marginBottom:3},
  cardTitle:{color:C.link,fontSize:14,fontWeight:'600',lineHeight:20,marginBottom:4},
  cardSnip:{color:C.text,fontSize:12,lineHeight:18},
  moreBtn: {alignItems:'center',paddingVertical:14,marginTop:4,backgroundColor:C.accentDim,borderRadius:10,borderWidth:1,borderColor:C.accent},
  moreBtnT:{color:C.accent,fontWeight:'600',fontSize:13},
  body:    {color:C.text,fontSize:13,lineHeight:21,marginBottom:8},
  h:       {color:'#F0F0F8',fontWeight:'700',marginTop:14,marginBottom:5},
  linkRow: {paddingVertical:8,paddingHorizontal:11,marginBottom:5,backgroundColor:C.linkBg,borderRadius:8,borderLeftWidth:3,borderLeftColor:C.link},
  linkT:   {color:C.link,fontSize:13,lineHeight:21},
  eof:     {alignItems:'center',marginTop:24,paddingBottom:8},
  eofLine: {width:40,height:1,backgroundColor:C.border,marginBottom:12},
  eofBtn:  {color:C.accent,fontSize:12},
  botBar:  {flexDirection:'row',backgroundColor:C.surface,borderTopWidth:1,borderTopColor:C.border,paddingTop:7,paddingBottom:Platform.OS==='ios'?22:7},
  botBtn:  {flex:1,alignItems:'center'},
  botI:    {color:C.text,fontSize:17},
  botL:    {color:C.sub,fontSize:8,marginTop:1},
  overlay: {...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.7)'},
  sheet:   {position:'absolute',bottom:0,left:0,right:0,backgroundColor:C.surface,borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'85%',borderWidth:1,borderColor:C.border,overflow:'hidden'},
  handle:  {width:36,height:4,borderRadius:2,backgroundColor:C.border},
  sheetHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border},
  sheetTitle:{color:C.text,fontSize:15,fontWeight:'700'},
  sheetDone:{color:C.accent,fontSize:14,fontWeight:'600'},
  tabs:    {flexDirection:'row',borderBottomWidth:1,borderBottomColor:C.border},
  tabBtn:  {flex:1,paddingVertical:11,alignItems:'center'},
  tabOn:   {borderBottomWidth:2,borderBottomColor:C.accent},
  tabT:    {color:C.sub,fontSize:12},
  tabTOn:  {color:C.accent,fontWeight:'600'},
  row:     {flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border,gap:10},
  rowT:    {color:C.text,fontSize:12},
  rowS:    {color:C.sub,fontSize:10,marginTop:2},
  rowTs:   {color:C.sub,fontSize:10},
  empty:   {color:C.sub,textAlign:'center',padding:36,fontSize:13,lineHeight:21},
  clearBtn:{margin:10,padding:12,backgroundColor:'#2D1515',borderRadius:9,alignItems:'center',borderWidth:1,borderColor:'#5C2020'},
  clearT:  {color:C.danger,fontWeight:'600',fontSize:13},
});

const ais = StyleSheet.create({
  root:       {flex:1,backgroundColor:C.bg},
  header:     {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:13,backgroundColor:C.surface,borderBottomWidth:1,borderBottomColor:C.border},
  aiDot:      {width:34,height:34,borderRadius:17,backgroundColor:C.accent,alignItems:'center',justifyContent:'center'},
  headerTitle:{color:C.text,fontSize:15,fontWeight:'700'},
  headerSub:  {color:C.sub,fontSize:10,marginTop:1},
  closeBtn:   {padding:6},
  ctx:        {backgroundColor:C.card,paddingHorizontal:14,paddingVertical:7,borderBottomWidth:1,borderBottomColor:C.border},
  ctxT:       {color:C.sub,fontSize:11},
  msgs:       {flex:1},
  welcome:    {alignItems:'center',paddingTop:32,paddingHorizontal:20},
  welcomeIcon:{width:56,height:56,borderRadius:28,backgroundColor:C.accent,alignItems:'center',justifyContent:'center',marginBottom:14},
  welcomeTitle:{color:C.text,fontSize:18,fontWeight:'700',marginBottom:8},
  welcomeSub: {color:C.sub,fontSize:13,textAlign:'center',lineHeight:20,marginBottom:16},
  sugLabel:   {color:C.sub,fontSize:10,letterSpacing:1,marginBottom:8,alignSelf:'flex-start'},
  sug:        {backgroundColor:C.card,borderRadius:10,paddingHorizontal:14,paddingVertical:11,borderWidth:1,borderColor:C.border,width:'100%',marginBottom:7},
  sugT:       {color:C.text,fontSize:13},
  userBubble: {alignSelf:'flex-end',backgroundColor:C.accentDim,borderRadius:16,borderBottomRightRadius:4,padding:12,maxWidth:'82%',marginBottom:10},
  botBubble:  {alignSelf:'flex-start',flexDirection:'row',gap:10,maxWidth:'88%',marginBottom:10,alignItems:'flex-start'},
  botAvatar:  {width:26,height:26,borderRadius:13,backgroundColor:C.accent,alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2},
  typingDots: {flexDirection:'row',alignItems:'center',paddingTop:4},
  userT:      {color:C.text,fontSize:13,lineHeight:20},
  botT:       {color:C.text,fontSize:13,lineHeight:20,flex:1},
  inputBar:   {flexDirection:'row',alignItems:'flex-end',paddingHorizontal:12,paddingVertical:10,backgroundColor:C.surface,borderTopWidth:1,borderTopColor:C.border,gap:8,paddingBottom:Platform.OS==='ios'?26:10},
  input:      {flex:1,backgroundColor:C.card,borderRadius:20,paddingHorizontal:14,paddingVertical:10,color:C.text,fontSize:14,maxHeight:100,borderWidth:1,borderColor:C.border},
  sendBtn:    {width:38,height:38,borderRadius:19,backgroundColor:C.accent,alignItems:'center',justifyContent:'center'},
});
