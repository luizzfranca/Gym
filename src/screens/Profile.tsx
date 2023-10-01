import {
  Center,
  Heading,
  ScrollView,
  Skeleton,
  Text,
  VStack,
  useToast,
} from "native-base";
import { ScreenHeader } from "@components/ScreenHeader";
import { UserPhoto } from "@components/UserPhoto";
import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import * as ImagePicker from "expo-image-picker";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "@hooks/useAuth";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { AppError } from "@utils/AppError";
import { api } from "@services/api";

import defaultUserPhotoImg from "@assets/userPhotoDefault.png";

type FormDataProps = {
  name: string;
  email: string;
  password: string;
  old_password: string;
  confirm_password: string;
};

const PHOTO_SIZE = 33;

const profileSchema = yup.object({
  name: yup.string().required("Informe o nome"),
  password: yup
    .string()
    .min(6, "A senha deve ter pelo menos 6 dígitos.")
    .nullable()
    .transform((value) => (!!value ? value : null)),
  password_confirm: yup
    .string()
    .nullable()
    .transform((value) => (!!value ? value : null))
    .oneOf([yup.ref("password"), null], "As senhas devem ser iguais.")
    .when("password", {
      is: (Field: any) => Field,
      then: (schema) =>
        schema
          .nullable()
          .required("Informe a confirmação de senha.")
          .transform((value) => (!!value ? value : null)),
    }), // fica atento ao codigo de confirmar o password, pois tem varias regras ai
  //1) a confirmação da senha tem que ser igual ao password
  //2 se eu so colocar a senha e não confirmar e clicar no botão de enviar não vai passar
  //porque precisa primeiro confirmar a senha para depois fazer o submit, então a regra ta tudo nisso ai
});

export function Profile() {
  const [photoIsLoading, setPhotoIsLoading] = useState(false);
  

  const [isUpdating, setIsUpdating] = useState(false);

  const toast = useToast();
  const { user, updateUserProfile } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormDataProps>({
    defaultValues: {
      name: user.name, //atraves do user que tem as informações do usuario, aqui tras o nome
      email: user.email, //atraves do user que tem as informações do usuario, aqui tras o email
    },
    resolver: yupResolver(profileSchema) as any,
  });

  async function handleUserPhotoSelect() {
    setPhotoIsLoading(true);
    try {
      const photoSelected = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, //selecionar o que eu quero, vídeo, imagem, etc.
        quality: 1,
        aspect: [4, 4],
        allowsEditing: true, // opção para editar imagem, cortar e etc.
      }); //acessar o albúm do usuário.

      if (photoSelected.canceled) {
        return;
      }

      const fileExtension = photoSelected.assets[0].uri.split(".").pop(); // pega o formato da foto, png/jpeg e etc.

      const photoFile = {
        name: `${user.name}.${fileExtension}`.toLocaleLowerCase(), // nome do usuario com a extensao, ex: joao.jpeg
        uri: photoSelected.assets[0].uri, // onde a imagem está
        type: `${photoSelected.assets[0].type}/${fileExtension}`  // tipando o que é que vai ser enviado 
      } as any;

      const userPhotoUploadForm = new FormData();
      userPhotoUploadForm.append("avatar", photoFile) // formulario para deixar pronto enviar a foto, esse avatar é o parametro que o backend deu para ser enviado

      const avatarUpdatedResponse = await api.patch("/users/avatar", userPhotoUploadForm, {
        headers: {
          "Content-Type": "multipart/form-data" // informando que eu estou enviado um ARQUIVO, e não algo em json, pq o axios sempre espera isso
        },
      });

      const userUpdated = user;
      userUpdated.avatar = avatarUpdatedResponse.data.avatar // pega o avatar atualizado no backend e enviar para essa const, ou seja, a foto que eu acabei de atualizar coloco dentro dessa const

      updateUserProfile(userUpdated);

      toast.show({
        title: "Foto atualizada",
        placement: "top",
        bgColor: "green.500",
      });

    } catch (error) {
      console.log(error);
    } finally {
      setPhotoIsLoading(false);
    }
  }

  async function handleProfileUpdate(data: FormDataProps) {
    try {
      setIsUpdating(true);

      const userUpdated = user;
      userUpdated.name = data.name;

      await api.put("/users", data);

      await updateUserProfile(userUpdated);

      console.log(userUpdated);

      toast.show({
        title: "Perfil atualizado com sucesso!",
        placement: "top",
        bgColor: "green.500",
      });
    } catch (error) {
      const isAppError = error instanceof AppError;
      const title = isAppError
        ? error.message
        : "Não foi possível atualizar os dados. Tente novamente mais tarde.";

      toast.show({
        title,
        placement: "top",
        bgColor: "red.500",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <VStack flex={1}>
      <ScreenHeader title="Perfil" />
      <ScrollView>
        <Center mt={6} px={10}>
          {photoIsLoading ? (
            <Skeleton
              w={PHOTO_SIZE}
              h={PHOTO_SIZE}
              rounded="full"
              startColor="gray.500"
              endColor="gray.400"
            />
          ) : (
            <UserPhoto
            source={
              user.avatar
                ? { uri: `${api.defaults.baseURL}/avatar/${user.avatar}` } // buscando o endereço do back + a imagem em si exemplo : https endereço do back / avatar, esse base serve pra isso puxar a base do back que é o https
                : defaultUserPhotoImg
            }
              alt="Foto do usuário"
              size={PHOTO_SIZE}
            />
          )}

          <TouchableOpacity onPress={handleUserPhotoSelect}>
            <Text
              color="green.500"
              fontWeight="bold"
              fontSize="md"
              mt={2}
              mb={8}
            >
              Alterar Foto
            </Text>
          </TouchableOpacity>

          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <Input
                bg="gray.600"
                placeholder="Nome"
                onChangeText={onChange}
                value={value}
                errorMessage={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <Input
                bg="gray.600"
                placeholder="E-mail"
                isDisabled
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </Center>

        <VStack px={10} mt={12} mb={9}>
          <Heading color="gray.200" fontSize="md" mb={2} fontFamily="heading">
            Alterar senha
          </Heading>

          <Controller
            control={control}
            name="old_password"
            render={({ field: { onChange } }) => (
              <Input
                bg="gray.600"
                placeholder="Senha antiga"
                secureTextEntry
                onChangeText={onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange } }) => (
              <Input
                bg="gray.600"
                placeholder="Nova senha"
                secureTextEntry
                onChangeText={onChange}
                errorMessage={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange } }) => (
              <Input
                bg="gray.600"
                placeholder="Confirme a nova senha"
                secureTextEntry
                onChangeText={onChange}
                errorMessage={errors.confirm_password?.message}
              />
            )}
          />

          <Button
            title="Atualizar"
            mt={4}
            onPress={handleSubmit(handleProfileUpdate)}
            isLoading={isUpdating}
          />
        </VStack>
      </ScrollView>
    </VStack>
  );
}
