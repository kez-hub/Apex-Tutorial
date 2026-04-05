import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: Message;
  unreadCount: number;
}

export default function Messages() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const instructorId = searchParams.get("instructor");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations
  useEffect(() => {
    if (!user || !userData) return;

    const loadConversations = async () => {
      try {
        // If instructorId is provided (from course card), create conversation with that instructor
        if (instructorId) {
          const instructorDoc = await getDoc(doc(db, "users", instructorId));
          if (instructorDoc.exists()) {
            const instructorData = instructorDoc.data();
            const conversation: Conversation = {
              id: instructorId,
              participantId: instructorId,
              participantName:
                instructorData.full_name ||
                instructorData.email?.split("@")[0] ||
                "Instructor",
              participantAvatar: instructorData.avatarBase64,
              unreadCount: 0,
            };
            setConversations([conversation]);
            setSelectedConversation(conversation);
          }
        } else {
          // Load all conversations for the current user
          const messagesRef = collection(db, "messages");
          const q = query(
            messagesRef,
            where("participants", "array-contains", user.uid),
          );

          const unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
              const participantIds = new Set<string>();

              snapshot.forEach((doc) => {
                const data = doc.data();
                const otherParticipantId =
                  data.senderId === user.uid ? data.receiverId : data.senderId;
                participantIds.add(otherParticipantId);
              });

              const conversationsList: Conversation[] = [];
              for (const participantId of participantIds) {
                try {
                  const participantDoc = await getDoc(
                    doc(db, "users", participantId),
                  );
                  if (participantDoc.exists()) {
                    const participantData = participantDoc.data();
                    conversationsList.push({
                      id: participantId,
                      participantId,
                      participantName:
                        participantData.full_name ||
                        participantData.email?.split("@")[0] ||
                        "User",
                      participantAvatar: participantData.avatarBase64,
                      unreadCount: 0, // TODO: Calculate unread count
                    });
                  }
                } catch (error) {
                  console.error(
                    `Error loading participant ${participantId}:`,
                    error,
                  );
                }
              }

              setConversations(conversationsList);
              if (conversationsList.length > 0 && !selectedConversation) {
                setSelectedConversation(conversationsList[0]);
              }
            },
            (error) => {
              console.error("Conversations listener error:", error);
              toast({
                title: "Unable to load conversations",
                description:
                  "There was a permissions or network issue loading your conversations.",
                variant: "destructive",
              });
            },
          );

          return () => unsubscribe();
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [user, userData, instructorId, selectedConversation]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("participants", "array-contains", user.uid),
      orderBy("timestamp", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<Message, "id" | "timestamp"> & {
            timestamp: unknown;
          };
          const timestamp: Date = (() => {
            const rawTimestamp = data.timestamp;
            if (
              typeof rawTimestamp === "object" &&
              rawTimestamp !== null &&
              "toDate" in rawTimestamp &&
              typeof (rawTimestamp as { toDate: unknown }).toDate === "function"
            ) {
              return (rawTimestamp as { toDate: () => Date }).toDate();
            }
            return new Date();
          })();
          if (
            (data.senderId === user.uid &&
              data.receiverId === selectedConversation.participantId) ||
            (data.senderId === selectedConversation.participantId &&
              data.receiverId === user.uid)
          ) {
            msgs.push({
              id: doc.id,
              senderId: data.senderId,
              receiverId: data.receiverId,
              content: data.content,
              isRead: data.isRead,
              timestamp,
            });
          }
        });
        setMessages(msgs);
      },
      (error) => {
        console.error("Messages snapshot error:", error);
        toast({
          title: "Unable to load messages",
          description:
            "There was a permissions or network issue loading this conversation.",
          variant: "destructive",
        });
      },
    );

    return () => unsubscribe();
  }, [selectedConversation, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      await addDoc(collection(db, "messages"), {
        senderId: user.uid,
        receiverId: selectedConversation.participantId,
        content: newMessage.trim(),
        timestamp: new Date(),
        isRead: false,
        participants: [user.uid, selectedConversation.participantId],
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-2">
              Connect with your instructors and get help with your courses.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 min-h-[calc(100vh-18rem)]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="h-full min-h-[320px]">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <p>No conversations yet.</p>
                      <p className="text-sm mt-1">
                        Click the message icon on course cards to start chatting
                        with instructors.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConversation?.id === conversation.id
                              ? "bg-primary/10 border border-primary/20"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={conversation.participantAvatar}
                              />
                              <AvatarFallback>
                                {conversation.participantName
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {conversation.participantName}
                              </p>
                              {conversation.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.lastMessage.content}
                                </p>
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                                {conversation.unreadCount > 99
                                  ? "99+"
                                  : conversation.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="lg:col-span-2 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Messages</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col min-h-[500px]">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4 min-h-0">
                  {selectedConversation ? (
                    messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No messages yet.</p>
                        <p className="text-sm mt-1">
                          Start the conversation by sending a message below.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === user?.uid
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                message.senderId === user?.uid
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Select a conversation to start messaging.</p>
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                {selectedConversation && (
                  <div className="sticky bottom-0 bg-background border-t border-border/50 p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
