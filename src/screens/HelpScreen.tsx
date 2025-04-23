import React, { useState, useEffect, useContext } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../ThemeContext';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../utils/config';
import { URL } from '../utils/config';

const socket = io(`${URL}`);

const HelpScreen: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return null;
  }

  const { user } = authContext;
  const userId = user?._id;

  const [supportInput, setSupportInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ senderId: string; content: string }[]>([]);
  const [isChatVisible, setChatVisible] = useState(false);
  const [helpId, setHelpId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  const theme = isDarkMode
    ? {
        backgroundColor: '#333',
        textColor: '#fff',
        cardBackground: '#444',
        inputBackground: '#555',
        inputBorderColor: '#666',
        buttonBackground: '#28a745', // Changed to green
        buttonTextColor: '#fff',
        dividerColor: '#555',
        chatMessageMe: '#28a745', // Changed to green
        chatMessageOther: '#666',
        chatMessageOtherText: '#fff',
        successColor: '#28a745', // Changed to green
        chatHeaderBackground: '#28a745', // Added for green header
        chatFooterBackground: '#28a745', // Added for green footer
      }
    : {
        backgroundColor: '#f8f9fa',
        textColor: '#333',
        cardBackground: '#fff',
        inputBackground: '#fff',
        inputBorderColor: '#ccc',
        buttonBackground: '#28a745', // Changed to green
        buttonTextColor: '#fff',
        dividerColor: '#ccc',
        chatMessageMe: '#28a745', // Changed to green
        chatMessageOther: '#e9ecef',
        chatMessageOtherText: '#000',
        successColor: '#28a745', // Changed to green
        chatHeaderBackground: '#28a745', // Added for green header
        chatFooterBackground: '#28a745', // Added for green footer
      };

  // FAQ data
  const faqData = [
    { question: t('faq_question_1'), answer: t('faq_answer_1') },
    { question: t('faq_question_2'), answer: t('faq_answer_2') },
  ];

  // Check for existing help session
  useEffect(() => {
    const checkHelpSession = async () => {
      try {
        const response = await fetch(`${BASE_URL}/help/${userId}`, {
          headers: {
            Authorization: `Bearer ${authContext.userToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            const help = data.data;
            setHelpId(help._id);
            socket.emit('joinRoom', help._id);
            setChatVisible(true);
            if (help.status === 'pending') {
              setStaffName(t('waiting_for_staff'));
            } else {
              const staff = await loadUsers(help.staffId);
              setStaffName(staff || t('waiting_for_staff'));
            }
            await getMessages(help._id);
          }
        }
      } catch (error) {
        console.error('Error checking help session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkHelpSession();

    // Socket.IO listeners
    socket.on('newMessage', (data: { senderId: string; message: string }) => {
      if (data.senderId !== userId) {
        setChatMessages((prev) => [...prev, { senderId: data.senderId, content: data.message }]);
      }
    });

    socket.on('helpAccepted', async (data: { _id: string; staffId: string }) => {
      if (data._id === helpId) {
        await getMessages(data._id);
        const staff = await loadUsers(data.staffId);
        setStaffName(staff || t('waiting_for_staff'));
      }
    });

    socket.on('helpClosed', (data: { _id: string }) => {
      if (data._id === helpId) {
        setChatVisible(false);
        setHelpId(null);
        setStaffName(null);
        setChatMessages([]);
      }
    });

    return () => {
      socket.off('newMessage');
      socket.off('helpAccepted');
      socket.off('helpClosed');
    };
  }, [helpId, userId, t]);

  // Fetch messages
  const getMessages = async (helpId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/help/messages/${helpId}`, {
        headers: {
          Authorization: `Bearer ${authContext.userToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setChatMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Load user name
  const loadUsers = async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/users/profile/${id}`, {
        headers: {
          Authorization: `Bearer ${authContext.userToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        return data.data.user.name;
      }
      return null;
    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  };

  // Handle support form submission
  const handleSupportSubmit = async () => {
    if (!supportInput.trim()) return;

    try {
      const response = await fetch(`${BASE_URL}/help/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authContext.userToken}`,
        },
        body: JSON.stringify({ content: supportInput }),
      });

      const data = await response.json();
      if (response.ok) {
        setHelpId(data.data.help._id);
        setChatVisible(true);
        setStaffName(t('waiting_for_staff'));
        setSupportInput('');
        socket.emit('joinRoom', data.data.help._id);
      } else {
        alert(t('error_support_create'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('error_support_create'));
    }
  };

  // Handle sending chat message
  const handleSendMessage = async () => {
    const message = supportInput.trim();
    if (!message || !helpId) return;

    try {
      const response = await fetch(`${BASE_URL}/help/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authContext.userToken}`,
        },
        body: JSON.stringify({ helpId, content: message }),
      });

      if (response.ok) {
        if (userId) {
          setChatMessages((prev) => [...prev, { senderId: userId, content: message }]);
        }
        socket.emit('sendMessage', { helpId, userId, message });
        setSupportInput('');
      } else {
        alert(t('error_message_send'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('error_message_send'));
    }
  };

  // Handle back button in chat view
  const handleBackFromChat = () => {
    // Just hide the chat UI without closing the actual help session
    setChatVisible(false);
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.backgroundColor }]}>
      {!isChatVisible ? (
        <>
          {/* Main view */}
          <StatusBar
            backgroundColor={theme.backgroundColor}
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          />
          
          {/* Back Button in Top-Left Corner with Icon (shown only in main view) */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../../assets/icon/icon_back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>

          <View style={styles.container}>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.buttonBackground} />
            ) : (
              <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Header */}
                <Text style={[styles.title, { color: theme.textColor }]}>📞 {t('contact_us')}</Text>
                <Text style={[styles.subtitle, { color: theme.textColor }]}>{t('contact_description')}</Text>
                <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />

                {/* FAQ and Support Form */}
                <View style={[styles.contactBox, { backgroundColor: theme.cardBackground }]}>
                  {/* FAQ */}
                  <Text style={[styles.sectionTitle, { color: theme.textColor }]}>❓ {t('faq')}</Text>
                  {faqData.map((faq, index) => (
                    <View key={index} style={styles.faqItem}>
                      <Text style={[styles.faqQuestion, { color: theme.textColor }]}>{faq.question}</Text>
                      <Text style={[styles.faqAnswer, { color: theme.textColor }]}>{faq.answer}</Text>
                    </View>
                  ))}

                  {/* Show existing chat button if there's an active help session */}
                  {helpId && (
                    <>
                      <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />
                      <Text style={[styles.sectionTitle, { color: theme.successColor }]}>💬 {t('active_support_session')}</Text>
                      <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: theme.buttonBackground }]}
                        onPress={() => setChatVisible(true)}
                      >
                        <Text style={[styles.submitButtonText, { color: theme.buttonTextColor }]}>{t('continue_chat')}</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Support Form */}
                  {!helpId && (
                    <>
                      <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />
                      <Text style={[styles.sectionTitle, { color: theme.successColor }]}>📩 {t('send_support_request')}</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.textColor, borderColor: theme.inputBorderColor }]}
                        multiline
                        numberOfLines={3}
                        placeholder={t('support_input_placeholder')}
                        placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                        value={supportInput}
                        onChangeText={setSupportInput}
                      />
                      <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: theme.buttonBackground }]}
                        onPress={handleSupportSubmit}
                      >
                        <Text style={[styles.submitButtonText, { color: theme.buttonTextColor }]}>{t('send_now')}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </>
      ) : (
        /* Chat View - Full Screen with green header and footer */
        <View style={{ flex: 1 }}>
          {/* Set status bar to match header color */}
          <StatusBar
            backgroundColor={theme.chatHeaderBackground}
            barStyle="light-content"
          />
          
          {/* Header background that extends behind status bar */}
          <View 
            style={[styles.headerBackground, { backgroundColor: theme.chatHeaderBackground }]} 
          />
          
          <SafeAreaView style={[styles.fullWidthContainer, { backgroundColor: theme.chatHeaderBackground }]}>
            <KeyboardAvoidingView 
              style={{ flex: 1 }} 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.chatFullScreen}>
                {/* Chat Header */}
                <View style={[styles.chatHeader, { backgroundColor: theme.chatHeaderBackground }]}>
                  <TouchableOpacity
                    style={styles.chatBackButton}
                    onPress={handleBackFromChat}
                  >
                    <Image
                      source={require('../../assets/icon/icon_back.png')}
                      style={[styles.backIcon, { tintColor: theme.buttonTextColor }]}
                    />
                  </TouchableOpacity>
                  <Text style={[styles.chatHeaderText, { color: theme.buttonTextColor }]}>{staffName}</Text>
                </View>
                
                {/* Chat Messages */}
                <ScrollView 
                  style={[styles.chatMessagesFullScreen, { backgroundColor: isDarkMode ? '#444' : '#f1f1f1' }]}
                  contentContainerStyle={styles.chatMessagesContent}
                >
                  {chatMessages.map((msg, index) => (
                    <View
                      key={index}
                      style={[
                        styles.message,
                        msg.senderId === userId
                          ? [styles.messageMe, { backgroundColor: theme.chatMessageMe }]
                          : [styles.messageOther, { backgroundColor: theme.chatMessageOther }],
                      ]}
                    >
                      <Text style={{ color: msg.senderId === userId ? theme.buttonTextColor : theme.chatMessageOtherText }}>
                        {msg.content}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                
                {/* Chat Input */}
                <View style={[styles.chatInputFullScreen, { backgroundColor: theme.chatFooterBackground }]}>
                  <TextInput
                    style={[styles.chatInputField, { backgroundColor: theme.inputBackground, color: theme.textColor, borderColor: theme.inputBorderColor }]}
                    placeholder={t('chat_input_placeholder')}
                    placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                    value={supportInput}
                    onChangeText={setSupportInput}
                  />
                  <TouchableOpacity
                    style={[styles.chatSendButton, { backgroundColor: theme.buttonBackground }]}
                    onPress={handleSendMessage}
                  >
                    <Text style={[styles.chatSendButtonText, { color: theme.buttonTextColor }]}>{t('send')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  fullWidthContainer: {
    flex: 1,
    width: '100%',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    zIndex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  contactBox: {
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  faqItem: {
    marginBottom: 10,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  faqAnswer: {
    fontSize: 14,
    marginBottom: 10,
    paddingLeft: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  submitButton: {
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  
  // Full screen chat styles
  chatFullScreen: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    height: 60,
  },
  chatBackButton: {
    marginRight: 15,
  },
  chatHeaderText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  chatMessagesFullScreen: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 15,
    paddingBottom: 20,
  },
  chatInputFullScreen: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  chatInputField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    maxHeight: 100,
  },
  chatSendButton: {
    marginLeft: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    padding: 12,
    marginVertical: 5,
    borderRadius: 15,
    maxWidth: '80%',
  },
  messageMe: {
    alignSelf: 'flex-end',
  },
  messageOther: {
    alignSelf: 'flex-start',
  },
});

export default HelpScreen;