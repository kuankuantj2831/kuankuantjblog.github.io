import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from 'react-query';
import CodePush from 'react-native-code-push';

// 屏幕
import HomeScreen from './screens/HomeScreen';
import ArticleScreen from './screens/ArticleScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import MessageScreen from './screens/MessageScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';

// 商店
import { useAuthStore } from './stores/authStore';

// 服务
import { notificationService } from './services/notificationService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// 底部导航
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Discover':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Message':
              iconName = focused ? 'message-text' : 'message-text-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen}
        options={{ tabBarLabel: '发现' }}
      />
      <Tab.Screen 
        name="Message" 
        component={MessageScreen}
        options={{ tabBarLabel: '消息' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
}

// 主应用
function App(): React.JSX.Element {
  const { isAuthenticated, init } = useAuthStore();

  useEffect(() => {
    init();
    notificationService.initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            {!isAuthenticated ? (
              <>
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen}
                  options={{ presentation: 'modal' }}
                />
              </>
            ) : (
              <>
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen 
                  name="Article" 
                  component={ArticleScreen}
                  options={{ headerShown: true }}
                />
                <Stack.Screen 
                  name="Search" 
                  component={SearchScreen}
                  options={{ headerShown: true, title: '搜索' }}
                />
                <Stack.Screen 
                  name="Settings" 
                  component={SettingsScreen}
                  options={{ headerShown: true, title: '设置' }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// Code Push 配置
const codePushOptions = {
  checkFrequency: CodePush.CheckFrequency.ON_APP_START,
  installMode: CodePush.InstallMode.ON_NEXT_RESTART,
};

export default CodePush(codePushOptions)(App);
