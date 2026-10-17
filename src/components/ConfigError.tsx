import { Text, View } from 'react-native';

interface ConfigErrorProps {
  message?: string;
}

export function ConfigError({ message }: ConfigErrorProps) {
  return (
    <View className="flex-1 items-center justify-center bg-bg px-6">
      <Text className="text-2xl font-bold text-text">Error de configuración</Text>
      <Text className="mt-2 text-center text-sm text-muted">
        Faltan variables de entorno requeridas. Revisa tu archivo .env.
      </Text>
      {message ? (
        <Text className="mt-4 text-center text-xs text-negative">{message}</Text>
      ) : null}
    </View>
  );
}
