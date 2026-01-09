import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Text, Divider, Card, Button, Modal, Portal } from "react-native-paper";
import { Icon } from "react-native-elements";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import api from "../axiosInstance";
import { Dropdown } from "react-native-paper-dropdown";
import { Picker } from "@react-native-picker/picker";
import Colors from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import { config } from "../utils/config";
import { formatPace } from "../utils/paceUtils";
import LoadingIndicator from "../components/LoadingIndicator";
import { handleError } from "../utils/errorHandler";

export default function StatisticsScreen() {
  const [activeTab, setActiveTab] = useState("Weekly");
  const [recentRuns, setRecentRuns] = useState([]);
  const [runsCount, setRunsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [statsData, setStatsData] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const [selectedMonth, setSelectedMonth] = useState(
    monthNames[currentMonthIndex]
  );
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString()
  );

  const [selectedWeek, setSelectedWeek] = useState("");
  const [isFirstCall, setIsFirstCall] = useState(true);
  const { token } = useAuth();

  const hideModal = () => setModalVisible(false);
  useEffect(() => {
    const initialize = async () => {
      await handleSelectButton();
    };

    if (isFirstCall && selectedWeek) {
      initialize();
      setIsFirstCall(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    if (activeTab === "Monthly") {
      const fetchMonthlyStats = async () => {
        try {
          const period = "month";

          const selectedMonthData = `${selectedYear}-${selectedMonth}-01`;

          const response = await api.get(
            `/runs/getstats?period=${period}&referenceDate=${selectedMonthData}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log(response.data);
          setStatsData(response.data);
        } catch (error) {
          handleError(error, "Fetching statistics for the selected period");
        } finally {
        }
      };

      fetchMonthlyStats();
    } else if (activeTab === "Yearly") {
      const fetchYearlyStats = async () => {
        try {
          const period = "year";

          const selectedYearlyData = `${selectedYear}-${selectedMonth}-01`;

          const response = await api.get(
            `/runs/getstats?period=${period}&referenceDate=${selectedYearlyData}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log(response.data);
          setStatsData(response.data);
        } catch (error) {
          handleError(error, "Fetching statistics for the selected period");
        } finally {
        }
      };

      fetchYearlyStats();
    } else if (activeTab === "Weekly") {
      const fetchWeeklyStats = async () => {
        try {
          const period = "week";
          const week = getCurrentWeek();

          const response = await api.get(
            `/runs/getstats?period=${period}&referenceDate=${week.value}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          setStatsData(response.data);
        } catch (error) {
          handleError(
            error,
            "Fetching statistics wkke for the selected period"
          );
        } finally {
        }
      };

      fetchWeeklyStats();
    }
  }, [activeTab]);

  useEffect(() => {
    const setInitialWeek = async () => {
      const week = getCurrentWeek();
      setSelectedWeek(week);
    };
    setInitialWeek();
  }, []);

  function formatWeekRange(startOfWeek, endOfWeek) {
    const dayOptions = { day: "numeric" };
    const monthYearOptions = { month: "long", year: "numeric" };

    const startDay = startOfWeek.toLocaleDateString("en-GB", dayOptions);
    const endDay = endOfWeek.toLocaleDateString("en-GB", dayOptions);
    const startMonthYear = startOfWeek.toLocaleDateString(
      "en-GB",
      monthYearOptions
    );
    const endMonthYear = endOfWeek.toLocaleDateString(
      "en-GB",
      monthYearOptions
    );

    if (startMonthYear === endMonthYear) {
      return `${startDay}–${endDay} ${startMonthYear}`;
    }

    return `${startDay} ${startMonthYear} – ${endDay} ${endMonthYear}`;
  }

  function getCurrentWeek() {
    const currentDate = new Date();
    const day = currentDate.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const startOfWeek = new Date(
      currentDate.setDate(currentDate.getDate() + diff)
    );
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const formattedDate = startOfWeek.toISOString().split("T")[0];

    return {
      label: formatWeekRange(startOfWeek, endOfWeek),
      value: formattedDate,
    };
  }

  function generateWeeks() {
    const weeks = [];
    let date = new Date();
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(date.getFullYear() - 1);

    while (date >= oneYearAgo) {
      const startOfWeek = new Date(date);
      const endOfWeek = new Date(date);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const formattedDate = startOfWeek.toISOString().split("T")[0];

      weeks.push({
        label: formatWeekRange(startOfWeek, endOfWeek),
        value: formattedDate,
      });

      date.setDate(date.getDate() - 7);
    }

    return weeks;
  }

  const weeks = generateWeeks(new Date().getFullYear());

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2019 },
    (_, i) => `${2020 + i}`
  );

  const displayText =
    activeTab === "Weekly"
      ? selectedWeek && selectedWeek.label
        ? `${selectedWeek.label}`
        : "Select Week"
      : activeTab === "Monthly"
      ? `${selectedMonth} ${selectedYear}`
      : activeTab === "Yearly"
      ? `${selectedYear}`
      : "";

  const navigation = useNavigation();

  const LIMIT_OPTIONS = [
    { label: "10", value: 10 },
    { label: "25", value: 25 },
    { label: "50", value: 50 },
  ];

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  }

  function getPageOptions() {
    let pageCount = getPageCount();
    let options = [];

    for (let i = 1; i <= pageCount; i++) {
      options.push({ label: i.toString(), value: i });
    }

    return options;
  }

  function getPageCount() {
    var hasRemaining = (runsCount ?? 0) % limit !== 0;
    var pageCount = (runsCount ?? 0) / limit;

    return hasRemaining ? pageCount + 1 : pageCount;
  }

  const streamImageForRun = (runId) =>
    `${config.baseURL}/runs/StreamImageForRun/${runId}?access_token=${token}`;

  const fetchRecentRuns = async (page = 1, limit = 10) => {
    try {
      const response = await api.get(
        `/runs/recent?lowQuality=true&page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRecentRuns(response.data.recentRunsWithImgs);
      setRunsCount(response.data.count);
    } catch (error) {
      handleError(error, "Fetching recent runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentRuns(page, limit);
  }, [page, limit]);

  if (loading) {
    return <LoadingIndicator />;
  }

  async function handleSelectButton() {
    try {
      const monthMap = {
        January: "01",
        February: "02",
        March: "03",
        April: "04",
        May: "05",
        June: "06",
        July: "07",
        August: "08",
        September: "09",
        October: "10",
        November: "11",
        December: "12",
      };

      let period = "";
      let referenceDate = "";

      console.log("Active tab: ");
      console.log(activeTab);
      console.log("Selected week value: ");

      if (activeTab === "Weekly" && selectedWeek) {
        period = "week";
        referenceDate = selectedWeek.value;
      } else if (activeTab === "Monthly" && selectedMonth && selectedYear) {
        period = "month";
        const monthNumber = monthMap[selectedMonth];
        console.log(monthNumber);
        referenceDate = `${selectedYear}-${monthNumber}-01`;
      } else if (activeTab === "Yearly" && selectedYear) {
        period = "year";
        referenceDate = `${selectedYear}-01-01`;
      }

      console.log(referenceDate);
      console.log(selectedMonth);

      if (!period || !referenceDate) {
        return;
      }

      const response = await api.get(
        `/runs/getstats?period=${period}&referenceDate=${referenceDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setStatsData(response.data);

      console.log("API response:", response.data);
    } catch (error) {
      handleError(error, "Fetching statisctics for the selected period");
    } finally {
      setModalVisible(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleLarge" style={styles.titleText}>
        Overview
      </Text>
      <View style={styles.rowContainer}>
        {["Weekly", "Monthly", "Yearly"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
            <Text
              style={[
                styles.text,
                { color: "gray" },
                activeTab === tab && styles.activeTabText,
              ]}
              variant="labelLarge"
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.dropdown}
      >
        <Text style={styles.dropdownText}>{displayText}</Text>
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.pickerContainer}>
            {!!(activeTab === "Weekly") && (
              <Picker
                selectedValue={selectedWeek ? selectedWeek.label : ""}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(itemValue) => {
                  if (weeks && weeks.length > 0) {
                    const selectedWeekObj = weeks.find(
                      (week) => week.label === itemValue
                    );
                    if (selectedWeekObj) {
                      setSelectedWeek(selectedWeekObj);
                    } else {
                      Alert.alert("Week not found");
                    }
                  } else {
                    Alert.alert("Weeks array is empty or not initialized");
                  }
                }}
              >
                {weeks.map((week) => (
                  <Picker.Item
                    key={week.value}
                    label={week.label}
                    value={week.label}
                  />
                ))}
              </Picker>
            )}

            {!!(activeTab === "Monthly") && (
              <>
                <Picker
                  selectedValue={selectedMonth}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  onValueChange={(itemValue) => setSelectedMonth(itemValue)}
                >
                  {months.map((month) => (
                    <Picker.Item key={month} label={month} value={month} />
                  ))}
                </Picker>

                <Picker
                  selectedValue={selectedYear}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  onValueChange={(itemValue) => setSelectedYear(itemValue)}
                >
                  {years.map((year) => (
                    <Picker.Item key={year} label={year} value={year} />
                  ))}
                </Picker>
              </>
            )}
            {!!(activeTab === "Yearly") && (
              <>
                <Picker
                  selectedValue={selectedYear}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  onValueChange={(itemValue) => setSelectedYear(itemValue)}
                >
                  {years.map((year) => (
                    <Picker.Item key={year} label={year} value={year} />
                  ))}
                </Picker>
              </>
            )}
          </View>
          <Button mode="elevated" onPress={handleSelectButton}>
            Select
          </Button>
        </Modal>
      </Portal>

      <Divider style={styles.divider} />

      <View style={styles.routineItem}>
        <Icon name="map-marker-outline" type="material-community" size={30} />
        <View style={styles.textContainer}>
          <Text variant="titleLarge">
            {(statsData?.totalDistance / 1000).toFixed(2) ?? 0} km
          </Text>
          <Text style={styles.metricLabel} variant="labelMedium">
            {"Distance"}
          </Text>
        </View>
      </View>
      <View style={styles.statGrid}>
        <View style={styles.rowContainer}>
          <View style={styles.routineItem}>
            <Icon name="clock-outline" type="material-community" size={30} />
            <View style={styles.textContainer}>
              <Text variant="titleLarge">{statsData?.totalDuration ?? 0}</Text>
              <Text style={styles.metricLabel} variant="labelMedium">
                {"Duration"}
              </Text>
            </View>
          </View>
          <View style={styles.routineItem}>
            <Icon name="timer-outline" type="material-community" size={30} />
            <View style={styles.textContainer}>
              <Text variant="titleLarge">{statsData?.avgPace ?? 0}</Text>
              <Text style={styles.metricLabel} variant="labelMedium">
                Avg. pace
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.rowContainer}>
          <View style={styles.routineItem}>
            <Icon name="run" type="material-community" size={30} />
            <View style={styles.textContainer}>
              <Text variant="titleLarge">{statsData?.runCount ?? 0}</Text>
              <Text style={styles.metricLabel} variant="labelMedium">
                {"Runs"}
              </Text>
            </View>
          </View>
          <View style={styles.routineItem}>
            <Icon name="fire" type="material-community" size={30} />
            <View style={styles.textContainer}>
              <Text variant="titleLarge">{statsData?.totalCalories ?? 0}</Text>
              <Text style={styles.metricLabel} variant="labelMedium">
                {"Calories"}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Divider style={styles.divider} />

      <Text variant="titleLarge" style={styles.titleText}>
        {"Recent Runs"}
      </Text>
      <View style={styles.rowContainer}>
        <Dropdown
          label="Limit"
          placeholder="10"
          options={LIMIT_OPTIONS}
          value={limit}
          onSelect={setLimit}
          mode="outlined"
          hideMenuHeader="true"
          style={styles.dropdownPagenation}
        />

        <Dropdown
          label="Page"
          placeholder="1"
          options={getPageOptions()}
          value={page}
          onSelect={setPage}
          mode="outlined"
          hideMenuHeader="true"
          style={styles.dropdownPagenation}
        />
      </View>
      <View style={styles.rowContainer}>
        <TouchableOpacity
          style={[styles.pageButton, page === 1 && styles.disabledButton]}
          onPress={() => setPage((prevPage) => Math.max(prevPage - 1, 1))}
          disabled={page === 1}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>Page {page}</Text>

        <TouchableOpacity
          style={[
            styles.pageButton,
            page >= getPageCount() && styles.disabledButton,
          ]}
          onPress={() => setPage((prevPage) => prevPage + 1)}
          disabled={page >= getPageCount()}
        >
          <Icon name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {recentRuns.map((run, index) => (
        <TouchableOpacity
          key={index}
          onPress={() =>
            navigation.navigate("RunDetailsScreen", { runId: run.id })
          }
        >
          <Card key={index} style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.rowContainer}>
                {run?.image ? (
                  <Image
                    source={{ uri: streamImageForRun(run.id) }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require("../assets/commrun.png")}
                    style={styles.image}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.textContainer}>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.dateText}>
                      {formatDate(run.date)}
                    </Text>
                    <Text style={styles.runTypeText}>{run.type}</Text>
                  </View>
                  <View style={styles.metricsContainer}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricTitle}>{run.duration}</Text>
                      <Text style={styles.metricLabel} variant="labelMedium">
                        {"Duration"}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricTitle}>
                        {(run.distance / 1000).toFixed(2)}
                      </Text>
                      <Text style={styles.metricLabel} variant="labelMedium">
                        Distance
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricTitle}>
                        {formatPace(run.pace)}
                      </Text>
                      <Text style={styles.metricLabel} variant="labelMedium">
                        Average Pace
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  text: {
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  titleText: {
    padding: 10,
  },
  activeTabText: {
    color: "black",
    textDecorationLine: "underline",
    paddingBottom: 5,
  },
  routineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 10,
  },

  textContainer: {
    flexDirection: "column",
    marginLeft: 10,
  },
  divider: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "lightgrey",
    height: 1,
    margin: 5,
  },
  card: {
    backgroundColor: "#ECE6F0",
    margin: 10,
    borderRadius: 10,
    overflow: "hidden",
    width: "97%",
  },
  cardContent: {
    paddingLeft: 0,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 5,
    marginRight: 0,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateText: {
    fontWeight: "bold",
    paddingHorizontal: 5,
    paddingLeft: 15,
  },
  runTypeText: {
    color: "gray",
    fontSize: 14,
    paddingHorizontal: 5,
    paddingRight: 10,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
  },
  metricItem: {
    alignItems: "center",
    paddingHorizontal: 5,
  },
  metricTitle: {
    fontWeight: "bold",
    fontSize: 16,
    paddingHorizontal: 5,
  },
  metricLabel: {
    color: "gray",
    paddingRight: 5,
  },
  dropdownPagenation: {
    height: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    alignItems: "center",
    minHeight: 30,
    minWidth: 5,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  pickerContainer: {
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dropdown: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 18,
  },
  picker: {
    flex: 1,
  },
  selectButton: {
    backgroundColor: "black",
    padding: 15,
    alignItems: "center",
  },
  selectButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  pickerItem: {
    fontSize: 20,
    color: "black",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },

  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.plansGreen,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  pageButtonText: {
    color: "#fff",
  },
  pageIndicator: {
    marginHorizontal: 10,
  },
});
