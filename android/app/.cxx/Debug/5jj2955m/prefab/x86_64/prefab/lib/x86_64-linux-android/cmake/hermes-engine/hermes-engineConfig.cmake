if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/shash/.gradle/caches/8.14.1/transforms/b0d51a1dc1a0b93b96d0bfd1268ade37/transformed/hermes-android-0.80.1-debug/prefab/modules/libhermes/libs/android.x86_64/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/shash/.gradle/caches/8.14.1/transforms/b0d51a1dc1a0b93b96d0bfd1268ade37/transformed/hermes-android-0.80.1-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

