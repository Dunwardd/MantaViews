import { Text, View } from 'react-native';

type AuthNoticeProps = {
  message: string;
  tone?: 'error' | 'success';
};

export function AuthNotice({ message, tone = 'error' }: AuthNoticeProps) {
  const isError = tone === 'error';

  return (
    <View
      style={{
        backgroundColor: isError ? '#FEF3F2' : '#ECFDF3',
        borderColor: isError ? '#FDA29B' : '#ABEFC6',
        borderCurve: 'continuous',
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
      }}
    >
      <Text
        selectable
        style={{ color: isError ? '#912018' : '#05603A', fontSize: 14, lineHeight: 20 }}
      >
        {message}
      </Text>
    </View>
  );
}
