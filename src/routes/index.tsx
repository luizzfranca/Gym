import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { useTheme, Box } from "native-base";

import { AuthRoutes } from "./auth.routes";
import { AppRoutes } from "./app.routes";
import { useContext } from "react";
import { AuthContext } from "@contexts/AuthContext";
import { useAuth } from "@hooks/useAuth";
import { Loading } from "@components/Loading";

export function Routes() {
  const { colors } = useTheme();
  const theme = DefaultTheme;
  theme.colors.background = colors.gray[700];

  //const contextData = useContext(AuthContext); // aqui eu pego o acesso do que está no meu AuthContext.(maneira normal)
  const { user, isLoadingUserStorageData } = useAuth(); // aqui é usando um hook proprio la na pasta de hooks, para ficar melhor ainda.
 
 

  if(isLoadingUserStorageData){
    return <Loading />
  }
 
  return (
    <Box flex={1} bg="gray.700">
      <NavigationContainer theme={theme}>
        {user.id ? <AppRoutes /> : <AuthRoutes/>}
      </NavigationContainer>
    </Box>
  );
}
