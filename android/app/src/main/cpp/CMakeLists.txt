cmake_minimum_required(VERSION 3.22.1)
project(nodebridge)

add_library(nodebridge SHARED nodebridge.cpp)
target_include_directories(nodebridge PRIVATE ${LIBNODE_DIR}/include/node)

add_library(libnode SHARED IMPORTED)
set_target_properties(libnode PROPERTIES IMPORTED_LOCATION ${LIBNODE_DIR}/bin/${ANDROID_ABI}/libnode.so)

find_library(log-lib log)
target_link_libraries(nodebridge libnode ${log-lib})
