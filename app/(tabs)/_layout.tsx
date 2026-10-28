import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { FolderOpen, Home, Settings, ShoppingBag, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ icon: Icon, focused }: { icon: any; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 44, height: 38, borderRadius: 14,
        backgroundColor: focused ? 'rgba(0,209,178,0.15)' : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon
          size={23}
          color={focused ? '#00D1B2' : '#94A3B8'}
          strokeWidth={focused ? 2.5 : 1.8}
        />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#D8E5EC',
          borderTopWidth: 1,
          height: 48 + Math.max(insets.bottom, 4),
          paddingBottom: Math.max(insets.bottom, 4),
          paddingTop: 2,
          shadowColor: '#0F172A',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} />,
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="helmets"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={ShoppingBag} focused={focused} />,
          tabBarAccessibilityLabel: 'Helmets',
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={FolderOpen} focused={focused} />,
          tabBarAccessibilityLabel: 'Document vault',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Settings} focused={focused} />,
          tabBarAccessibilityLabel: 'Settings',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={UserRound} focused={focused} />,
          tabBarAccessibilityLabel: 'Rider profile',
        }}
      />
    </Tabs>
  );
}
