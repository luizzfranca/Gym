import { createContext, ReactNode, useEffect } from "react";
import { useState } from "react";

import { UserDTO } from "@dtos/UserDTO";
import { api } from "@services/api";
import {
  storageUserGet,
  storageUserRemove,
  storageUserSave,
} from "@storage/storageUser";
import {
  storageAuthTokenGet,
  storageAuthTokenRemove,
  storageAuthTokenSave,
} from "@storage/storageAuthToken";

export type AuthContextDataProps = {
  user: UserDTO;
  updateUserProfile: (userUpdated: UserDTO) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>; // atualizar o usuário.
  isLoadingUserStorageData: boolean;
  signOut: () => Promise<void>;
};

type AuthContextProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext<AuthContextDataProps>(
  {} as AuthContextDataProps
);
//aqui é pra criar o acesso do user para eu utilizar em qualquer lugar.
//eu chamo nessa aqui, ou seja, qualquer parte eu uso o AuthContext para usar as informações

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  //aqui é a função que vai ficar no app.tsx onde vai envolver toda a aplicação para poder ter acesso
  //ao user

  const [user, setUser] = useState<UserDTO>({} as UserDTO);
  const [isLoadingUserStorageData, setIsLoadingUserStorageData] =
    useState(true);

  async function UserAndTokenUpdate(userData: UserDTO, token: string) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`; // anexa o token no cabeçario

    setUser(userData); // atualizar o usuario;
  }

  async function storageUserAndTokenSave(
    userData: UserDTO,
    token: string,
    refresh_token: string
  ) {
    try {
      setIsLoadingUserStorageData(true);
      await storageUserSave(userData);
      await storageAuthTokenSave({ token, refresh_token });
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingUserStorageData(false);
    }
  } // salva o usuario e o token no dispositivo

  async function signIn(email: string, password: string) {
    try {
      const { data } = await api.post("/sessions", { email, password });

      if (data.user && data.token && data.refresh_token) {
        await storageUserAndTokenSave(
          data.user,
          data.token,
          data.refresh_token
        ); // salva os dados do usuario no dispositivo
        UserAndTokenUpdate(data.user, data.token); // atualiza o usuario e o token
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingUserStorageData(false);
    }
  } //logar usuario

  async function signOut() {
    try {
      setIsLoadingUserStorageData(true);
      setUser({} as UserDTO);
      await storageUserRemove();
      await storageAuthTokenRemove();
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingUserStorageData(false);
    }
  } //deslogar usuario

  async function updateUserProfile(userUpdated: UserDTO) {
    try {
      setUser(userUpdated); // atualiza o estado em sí
      await storageUserSave(userUpdated); // atualiza o DISPOSITIVO ou seja, tudo do storage é sobre o dispositivo
    } catch (error) {
      throw error;
    }
  }

  async function loadUserData() {
    try {
      setIsLoadingUserStorageData(true);

      const userLogged = await storageUserGet();
      const {token} = await storageAuthTokenGet();
      if (token && userLogged) {
        UserAndTokenUpdate(userLogged, token);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingUserStorageData(false);
    }
  } // carrega os dados antes para não mostrar a tela do login

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const subscribe = api.registerInterceptTokenManager(signOut);
    return () => {
      subscribe();
    };
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        isLoadingUserStorageData,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
