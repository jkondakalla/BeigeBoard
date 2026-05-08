import React from 'react';

import { View, Text, StyleSheet } from 'react-native';

const App = () => {

  return (

    <View style={styles.container}>

      <Text style={styles.title}>BeigeBoard Mobile</Text>

      <Text>Todo app for Android</Text>

    </View>

  );

};

const styles = StyleSheet.create({

  container: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor: '#f5f5dc',

  },

  title: {

    fontSize: 24,

    fontWeight: 'bold',

  },

});

export default App;