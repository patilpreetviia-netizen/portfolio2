import { useState, useEffect, useRef } from "react";
import { config } from "../config";
import "./styles/ChatBot.css";

/* ── SVG Icons ── */
const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ── Data ── */
const SYSTEM_PROMPT = `You are ${config.developer.fullName}, a passionate ${config.developer.title} from India. You are NOT an AI assistant - you ARE ${config.developer.name} himself chatting with visitors on your portfolio website.

About you (${config.developer.fullName}):
- Full name: ${config.developer.fullName}
- Location: ${config.social.location}
- Profession: ${config.developer.title}
- Company: Elite Forums (current internship)
- Specialties: AI/ML, Python, Data Analysis, No-Code Development, Workflow Automation, Prompt Engineering
- Projects: GENRAGE Streetwear E-Commerce, Enterprise Micro-Architecture Portal, Predictive Engagement Engine
- Education: Diploma in AI and ML at Bhausaheb Vartak Polytechnic (Expected 2028)
- Certification: Microsoft Certified Student Ambassador (Azure Fundamentals)
- Contact: ${config.social.email}
- GitHub: ${config.social.github}
- LinkedIn: ${config.social.linkedin}

Rules:
1. Always respond as ${config.developer.name} in first person ("I", "my", "me")
2. Be professional yet approachable, and concise (1-3 sentences max)
3. If asked about work/projects, share genuine experiences based on the profile
4. Never say you are an AI or language model - you are ${config.developer.name}
5. Keep tone professional - no slang or excessive punctuation
6. For detailed conversation, suggest visiting the /play page`;

const QUICK_REPLIES = [
  { label: "Who are you?",      text: "Who are you?" },
  { label: "Your projects",     text: "Tell me about your projects" },
  { label: "Skills & stack",    text: "What are your main skills?" },
  { label: "Contact info",      text: "How can I contact you?" },
];

const formatTime = (date) =>
  date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

/* ── Component ── */
const ChatBot = () => {
  const [isOpen,         setIsOpen]         = useState(false);
  const [hasUnread,      setHasUnread]       = useState(false);
  const [messages,       setMessages]        = useState([{
    role: "assistant",
    content: `Hi, I'm ${config.developer.name}. Feel free to ask me anything about my work or background.`,
    timestamp: new Date(),
  }]);
  const [input,          setInput]           = useState("");
  const [isTyping,       setIsTyping]        = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen && messages.length > 1) setHasUnread(true);
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const t = setTimeout(() => { if (!isOpen) setHasUnread(true); }, 3000);
    return () => clearTimeout(t);
  }, []);

  const sendMessage = async (overrideText) => {
    if (isTyping) return;
    const text = (overrideText || input).trim();
    if (!text) return;

    setShowQuickReplies(false);
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    setInput("");
    setIsTyping(true);

    try {
      const history = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ];
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, model: 'llama-3.3-70b-versatile' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Connection issue");
      }
      if (data.choices?.[0]?.message?.content) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.choices[0].message.content,
          timestamp: new Date(),
        }]);
      } else throw new Error("Connection issue");
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: err.message || "Connection issue — please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { 
      e.preventDefault(); 
      if (!isTyping) sendMessage(); 
    }
  };

  const handleClear = () => {
    setMessages([{
      role: "assistant",
      content: `Hi again, I'm ${config.developer.name}. What would you like to know?`,
      timestamp: new Date(),
    }]);
    setShowQuickReplies(true);
  };

  return (
    <div className="chatbot-widget" data-cursor="disable">

      {/* ── Chat Window ── */}
      <div className={`chatbot-window ${isOpen ? "chatbot-window-open" : ""}`}>

        {/* Header */}
        <div className="chatbot-window-header">
          <div className="chatbot-header-info">
            <div className="chatbot-header-avatar">
              <img src="/images/mypic.jpeg" alt={config.developer.name} />
              <span className="chatbot-online-dot" />
            </div>
            <div className="chatbot-header-text">
              <span className="chatbot-header-name">{config.developer.name}</span>
              <span className="chatbot-header-role">{config.developer.title}</span>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button className="chatbot-action-btn" onClick={handleClear} title="Clear conversation">
              <IconTrash />
            </button>
            <button className="chatbot-action-btn chatbot-close-btn" onClick={() => setIsOpen(false)} title="Close">
              <IconClose />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chatbot-msg chatbot-msg-${msg.role} chatbot-msg-animate`}>
              {msg.role === "assistant" && (
                <div className="chatbot-msg-avatar">
                  <img src="/images/mypic.jpeg" alt={config.developer.name} />
                </div>
              )}
              {msg.role === "user" && (
                <div className="chatbot-msg-avatar chatbot-user-avatar">
                  <IconUser />
                </div>
              )}
              <div className="chatbot-msg-body">
                <div className="chatbot-msg-bubble">{msg.content}</div>
                {msg.timestamp && (
                  <span className="chatbot-msg-time">{formatTime(msg.timestamp)}</span>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chatbot-msg chatbot-msg-assistant chatbot-msg-animate">
              <div className="chatbot-msg-avatar">
                <img src="/images/mypic.jpeg" alt={config.developer.name} />
              </div>
              <div className="chatbot-msg-body">
                <div className="chatbot-msg-bubble chatbot-typing-bubble">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Replies */}
        {showQuickReplies && (
          <div className="chatbot-quick-replies">
            {QUICK_REPLIES.map((qr, i) => (
              <button key={i} className="chatbot-chip" onClick={() => sendMessage(qr.text)}>
                {qr.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chatbot-input-row">
          <input
            ref={inputRef}
            type="text"
            className="chatbot-input"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="chatbot-send-btn"
            onClick={() => sendMessage()}
            disabled={isTyping || !input.trim()}
          >
            <IconSend />
          </button>
        </div>
      </div>

      {/* ── FAB ── */}
      <button
        className={`chatbot-fab ${isOpen ? "chatbot-fab-open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Chat with Preet"
      >
        <span className="chatbot-fab-icon">
          {isOpen ? <IconClose /> : <IconChat />}
        </span>
        {!isOpen && hasUnread && <span className="chatbot-fab-badge" />}
      </button>
    </div>
  );
};

export default ChatBot;
