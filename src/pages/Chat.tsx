import React, { useEffect, useState, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonList,
  IonItem,
  IonButton,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonTextarea,
} from "@ionic/react";
import { happyOutline, homeOutline, send } from "ionicons/icons";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { sendMessage, subscribeToMessages } from "../services/chatService";
import { Timestamp } from "firebase/firestore";
import "../styles/Chat.css";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

interface LocationState {
  userContact?: {
    firstName?: string;
    lastName?: string;
  };
  propertyId: string;
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const { chatId } = useParams<{ chatId: string }>();
  const history = useHistory();

  const [emojiPickerTheme, setEmojiPickerTheme] = useState<Theme>(
    "auto" as Theme
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const location = useLocation<LocationState>();
  const userContact = location.state?.userContact;
  const propertyId = location.state?.propertyId;

  // Subscribe to messages in this chat
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = subscribeToMessages(chatId, setMessages);
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (!propertyId) {
      const timeout = setTimeout(() => {
        history.replace("/not-found");
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [propertyId, history]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    console.log(propertyId);
    contentRef.current?.scrollToBottom(300);
  }, [messages, propertyId]);

  useEffect(() => {
    document.body.classList.add("hidden");

    const getTheme = async () => {
      const darkTheme =
        document.documentElement.classList.contains("ion-palette-dark");
      if (darkTheme) {
        setEmojiPickerTheme("dark" as Theme);
      } else {
        setEmojiPickerTheme("light" as Theme);
      }
    };

    getTheme();

    return () => {
      document.body.classList.remove("hidden");
    };
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const toggleEmojiPicker = () => setShowEmojiPicker(!showEmojiPicker);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !chatId) return;
    await sendMessage(chatId, user.uid, newMessage.trim());
    setNewMessage("");
    if (showEmojiPicker) setShowEmojiPicker(false);
  };

  const formatTimestamp = (ts: Timestamp) => {
    if (!ts) return "";
    const date = ts.toDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const mins = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${mins}`;
  };

  return (
    <IonPage className="chat-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/chats"></IonBackButton>
          </IonButtons>
          <IonTitle>
            {userContact?.firstName} {userContact?.lastName}
          </IonTitle>
          <IonButtons slot="end" style={{ marginRight: "15px" }}>
            <IonIcon
              icon={homeOutline}
              color="medium"
              slot="icon-only"
              onClick={() => {
                document.body.classList.remove("hidden");
                history.replace(`/details/${propertyId}`);
              }}
            />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} className="chat-content">
        <IonList className="chat-list">
          {messages.map((msg) => {
            const isOwn = user?.uid === msg.senderId;
            return (
              <IonItem
                key={msg.id}
                lines="none"
                className={isOwn ? "sent" : "received"}
              >
                <div className="message-wrapper">
                  <div className="message">{msg.text}</div>
                  <div className="timestamp">
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
              </IonItem>
            );
          })}
        </IonList>
      </IonContent>

      <IonFooter className="chat-footer">
        {showEmojiPicker && (
          <div className="emoji-picker">
            <EmojiPicker
              theme={emojiPickerTheme}
              onEmojiClick={handleEmojiClick}
            />
          </div>
        )}

        <div className="input-bar">
          <div className="textarea-container">
            <IonTextarea
              color="primary"
              placeholder="Napište zprávu..."
              value={newMessage}
              onIonInput={(e) => setNewMessage(e.detail.value!)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              onFocus={() => setShowEmojiPicker(false)}
              autoGrow
              spellcheck
              autoCorrect="on"
              rows={1}
              inputMode="text"
            ></IonTextarea>
          </div>

          <IonButtons>
            <IonButton fill="clear" onClick={toggleEmojiPicker}>
              <IonIcon icon={happyOutline} color="medium" slot="icon-only" />
            </IonButton>
          </IonButtons>

          <IonButtons>
            <IonButton
              fill="clear"
              onClick={handleSend}
              disabled={!newMessage.trim()}
            >
              <IonIcon slot="icon-only" icon={send} color="primary" />
            </IonButton>
          </IonButtons>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default Chat;
