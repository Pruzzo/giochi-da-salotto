// Ponte tra Java e Node.js: avvia node::Start con gli argomenti dati e manda stdout e stderr su logcat.
#include <jni.h>
#include <android/log.h>
#include <pthread.h>
#include <unistd.h>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>

#include "node.h"

namespace {

const char *TAG = "NodeServer";
int pipeOut[2];
int pipeErr[2];

void *forward(void *arg) {
  const bool isErr = arg != nullptr;
  const int fd = isErr ? pipeErr[0] : pipeOut[0];
  char buf[2048];
  ssize_t n;
  while ((n = read(fd, buf, sizeof buf - 1)) > 0) {
    if (buf[n - 1] == '\n') --n;
    buf[n] = 0;
    __android_log_write(isErr ? ANDROID_LOG_ERROR : ANDROID_LOG_INFO, TAG, buf);
  }
  return nullptr;
}

void redirectOutput() {
  setvbuf(stdout, nullptr, _IOLBF, 0);
  setvbuf(stderr, nullptr, _IONBF, 0);
  pipe(pipeOut);
  pipe(pipeErr);
  dup2(pipeOut[1], STDOUT_FILENO);
  dup2(pipeErr[1], STDERR_FILENO);
  pthread_t out, err;
  pthread_create(&out, nullptr, forward, nullptr);
  pthread_create(&err, nullptr, forward, reinterpret_cast<void *>(1));
  pthread_detach(out);
  pthread_detach(err);
}

}  // namespace

extern "C" JNIEXPORT jint JNICALL
Java_it_nomicosecitta_console_NodeService_startNode(JNIEnv *env, jclass, jobjectArray jargs) {
  const jsize argc = env->GetArrayLength(jargs);
  std::vector<std::string> args;
  for (jsize i = 0; i < argc; i++) {
    auto js = static_cast<jstring>(env->GetObjectArrayElement(jargs, i));
    const char *s = env->GetStringUTFChars(js, nullptr);
    args.emplace_back(s);
    env->ReleaseStringUTFChars(js, s);
    env->DeleteLocalRef(js);
  }

  // Node vuole gli argomenti in un unico blocco di memoria contiguo.
  size_t size = 0;
  for (const auto &a : args) size += a.size() + 1;
  char *block = static_cast<char *>(calloc(size, 1));
  std::vector<char *> argv;
  char *cursor = block;
  for (const auto &a : args) {
    memcpy(cursor, a.c_str(), a.size());
    argv.push_back(cursor);
    cursor += a.size() + 1;
  }

  redirectOutput();
  return node::Start(static_cast<int>(argv.size()), argv.data());
}
