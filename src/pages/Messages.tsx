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
  getDocs,
  collection,
  addDoc,
  updateDoc,
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
  const [showMessageView, setShowMessageView] = useState(false);

  // Load conversations
  useEffect(() => {
    if (!user || !userData) return;

    const loadConversations = async () => {
      try {
        // If instructorId is provided (from video card), create conversation with that instructor
        if (instructorId) {
          const instructorDoc = await getDoc(doc(db, "users", instructorId));
          if (instructorDoc.exists()) {
            const instructorData = instructorDoc.data();

            // Calculate unread count for this conversation
            const messagesRef = collection(db, "messages");
            const unreadQuery = query(
              messagesRef,
              where("participants", "array-contains", user.uid),
              where("senderId", "==", instructorId),
              where("receiverId", "==", user.uid),
              where("isRead", "==", false),
            );
            const unreadSnapshot = await getDocs(unreadQuery);

            const conversation: Conversation = {
              id: instructorId,
              participantId: instructorId,
              participantName:
                instructorData.full_name ||
                instructorData.email?.split("@")[0] ||
                "Instructor",
              participantAvatar: instructorData.avatarBase64,
              unreadCount: unreadSnapshot.size,
            };
            setConversations([conversation]);
            setSelectedConversation(conversation);
            setShowMessageView(true);
            // Mark messages as read when opening from video card
            markMessagesAsRead(conversation);
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

                    // Calculate unread count for this conversation
                    const unreadMessages = snapshot.docs.filter((doc) => {
                      const data = doc.data();
                      return (
                        data.senderId === participantId &&
                        data.receiverId === user.uid &&
                        !data.isRead
                      );
                    });

                    conversationsList.push({
                      id: participantId,
                      participantId,
                      participantName:
                        participantData.full_name ||
                        participantData.email?.split("@")[0] ||
                        "User",
                      participantAvatar: participantData.avatarBase64,
                      unreadCount: unreadMessages.length,
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
                setShowMessageView(true);
              }
            },
            (error) => {
              // Ignore permission errors during logout when user is no longer authenticated
              if (error.code === "permission-denied" && !user) {
                return;
              }
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
  }, [user, userData, instructorId, selectedConversation, toast]);

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
        // Ignore permission errors during logout when user is no longer authenticated
        if (error.code === "permission-denied" && !user) {
          return;
        }
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
  }, [selectedConversation, user, toast]);

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

  const markMessagesAsRead = async (conversation: Conversation) => {
    if (!user) return;

    try {
      const messagesRef = collection(db, "messages");
      const q = query(
        messagesRef,
        where("participants", "array-contains", user.uid),
        where("senderId", "==", conversation.participantId),
        where("receiverId", "==", user.uid),
        where("isRead", "==", false),
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { isRead: true }),
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking messages as read:", error);
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
              Connect with your instructors and get help with your videos.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 min-h-[calc(100vh-18rem)] rounded-lg overflow-hidden border border-border/50 lg:pb-0 pb-20">
            {/* Conversations List - Hidden on mobile when viewing messages, always visible on desktop */}
            <div
              className={`${
                showMessageView ? "hidden" : "block"
              } lg:block border-r border-border/50 bg-card`}
            >
              <Card className="border-0 rounded-0 overflow-hidden">
                <CardContent className="p-0">
                  <ScrollArea className="h-full min-h-[320px] lg:min-h-[calc(100vh-18rem)]">
                    {conversations.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <p>No conversations yet.</p>
                        <p className="text-sm mt-1">
                          Click the message icon on video cards to start
                          chatting with instructors.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0 p-0">
                        {conversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            onClick={() => {
                              setSelectedConversation(conversation);
                              setShowMessageView(true);
                              markMessagesAsRead(conversation);
                            }}
                            className={`px-4 py-3 cursor-pointer border-b border-border/30 transition-colors ${
                              selectedConversation?.id === conversation.id
                                ? "bg-primary/10"
                                : "hover:bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 flex-shrink-0">
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
                                  <p className="text-xs text-muted-foreground truncate">
                                    {conversation.lastMessage.content}
                                  </p>
                                )}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <div className="h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
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
            </div>

            {/* Messages Panel */}
            {selectedConversation ? (
              <div
                className={`${
                  showMessageView ? "block" : "hidden"
                } lg:block flex flex-col bg-card relative`}
              >
                <div className="border-b border-border/30 px-4 py-4 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMessageView(false)}
                    className="lg:hidden"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={selectedConversation.participantAvatar} />
                    <AvatarFallback>
                      {selectedConversation.participantName
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium text-sm">
                      {selectedConversation.participantName}
                    </h2>
                  </div>
                </div>

                {/* Messages Area - Add bottom padding on mobile for fixed input */}
                <ScrollArea className="flex-1 p-4 min-h-0 lg:pb-4 pb-20">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No messages yet.</p>
                      <p className="text-sm mt-2">
                        Start the conversation by sending a message below.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
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
                            className={`max-w-[85%] lg:max-w-[60%] px-3 py-2 rounded-lg text-sm ${
                              message.senderId === user?.uid
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1 leading-none">
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Fixed Input Area for Mobile */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border/30 px-4 py-4 z-10">
                  <div className="flex gap-2 max-w-6xl mx-auto">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-muted/50"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Desktop Input Area */}
                <div className="hidden lg:block border-t border-border/30 bg-card px-4 py-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-muted/50"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`${showMessageView ? "flex" : "hidden"} lg:flex items-center justify-center text-center text-muted-foreground`}
              >
                <div>
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
