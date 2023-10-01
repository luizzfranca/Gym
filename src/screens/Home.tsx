import { useCallback, useEffect, useState } from "react";
import { Group } from "@components/Group";
import { HomeHeader } from "@components/HomeHeader";
import { FlatList, HStack, Heading, Text, VStack, useToast } from "native-base";
import { ExerciseCard } from "@components/ExerciseCard";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AppNavigatorRoutesProps } from "@routes/app.routes";
import { AppError } from "@utils/AppError";
import { api } from "@services/api";
import { ExerciseDTO } from "@dtos/ExerciseDTO";
import { Loading } from "@components/Loading";

export function Home() {
  const [groups, setGroups] = useState<string[]>([]);
  const [groupSelected, setGroupSelected] = useState("antebraço");
  const [exercises, setExercises] = useState<ExerciseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation<AppNavigatorRoutesProps>();
  const toast = useToast();

  function handleOpenExerciseDetails(exerciseId: string) {
    navigation.navigate("exercise", {exerciseId});
  }

  async function fetchGroups() {
    try {
      const { data } = await api.get("/groups"); //esse data eu desestruturei, poderia ser response, para ficar response.data
      setGroups(data);
    } catch (error) {
      const isAppError = error instanceof AppError;
      const title = isAppError
        ? error.message
        : "Não foi possível carregar os grupos musculares";

      toast.show({
        title,
        placement: "top",
        bgColor: "red.500",
      });
    }
  }

  async function fetchExercisesByGroup() {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/exercises/bygroup/${groupSelected}`); //esse data eu desestruturei, poderia ser response, para ficar response.data
      setExercises(data);
    } catch (error) {
      const isAppError = error instanceof AppError;
      const title = isAppError
        ? error.message
        : "Não foi possível carregar os grupos musculares";

      toast.show({
        title,
        placement: "top",
        bgColor: "red.500",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExercisesByGroup();
    }, [groupSelected])
  );

  return (
    <VStack flex={1}>
      <HomeHeader />
      <HStack>
        <FlatList
          data={groups}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Group
              name={item}
              isActive={
                groupSelected.toLocaleUpperCase() === item.toLocaleUpperCase()
              }
              onPress={() => setGroupSelected(item)}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          _contentContainerStyle={{
            px: 8,
          }}
          my={10}
          maxH={10}
          minH={10}
        />
      </HStack>
      {isLoading ? (
        <Loading />
      ) : (
        <VStack flex={1} px={8}>
          <HStack justifyContent="space-between" mb={5}>
            <Heading color="gray.200" fontSize="md" fontFamily="heading">
              Exercícios
            </Heading>
            <Text color="gray.200" fontSize="sm">
              {exercises.length}
            </Text>
          </HStack>
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExerciseCard data={item} onPress={() => handleOpenExerciseDetails(item.id)} />
            )}
            showsVerticalScrollIndicator={false}
            _contentContainerStyle={{
              paddingBottom: 20,
            }}
          />
        </VStack>
      )}
    </VStack>
  );
}
