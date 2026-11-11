#define CAPACITY 128
#define NAME_SIZE 96
#define USER_SIZE 32

typedef struct {
  int pid;
  int kind;
  int state;
  int protected;
  char name[NAME_SIZE];
  char user[USER_SIZE];
} Process;

static Process table[CAPACITY];
static int next_pid = 1;
static char input_name[NAME_SIZE];
static char input_user[USER_SIZE];

static void copy(char *to, const char *from, int capacity) {
  int i = 0;
  for (; i < capacity - 1 && from[i]; ++i) to[i] = from[i];
  to[i] = 0;
}

static Process *find(int pid) {
  if (pid <= 0) return 0;
  for (int i = 0; i < CAPACITY; ++i) if (table[i].pid == pid) return &table[i];
  return 0;
}

static int add(const char *name, const char *user, int kind, int protected) {
  if (!name[0] || next_pid >= 2147483647) return 0;
  for (int i = 0; i < CAPACITY; ++i) {
    if (table[i].pid) continue;
    Process *p = &table[i];
    p->pid = next_pid++;
    p->kind = kind;
    p->state = 1;
    p->protected = !!protected;
    copy(p->name, name, NAME_SIZE);
    copy(p->user, user, USER_SIZE);
    return p->pid;
  }
  return 0;
}

void hx_init(void) {
  for (int i = 0; i < CAPACITY; ++i) table[i].pid = 0;
  next_pid = 1;
  add("init", "system", 1, 1);
  add("vfs", "system", 1, 1);
  add("helix-app", "system", 2, 1);
}

char *hx_name_input(void) { return input_name; }
char *hx_user_input(void) { return input_user; }
int hx_capacity(void) { return CAPACITY; }
int hx_pid_at(int index) { return index >= 0 && index < CAPACITY ? table[index].pid : 0; }
int hx_spawn(int kind, int protected) {
  if (kind < 0 || kind > 2) return 0;
  return add(input_name, input_user, kind, protected);
}
int hx_release(int pid) {
  Process *p = find(pid);
  if (!p || pid <= 3) return 0;
  p->pid = 0;
  return 1;
}
int hx_kill(int pid) {
  Process *p = find(pid);
  return p && !p->protected ? hx_release(pid) : 0;
}
int hx_state(int pid) { Process *p = find(pid); return p ? p->state : -1; }
int hx_kind(int pid) { Process *p = find(pid); return p ? p->kind : -1; }
int hx_protected(int pid) { Process *p = find(pid); return p ? p->protected : 0; }
const char *hx_name(int pid) { Process *p = find(pid); return p ? p->name : ""; }
const char *hx_user(int pid) { Process *p = find(pid); return p ? p->user : ""; }
int hx_update(int pid, int state) {
  Process *p = find(pid);
  if (!p || state < 0 || state > 3) return 0;
  p->state = state;
  return 1;
}
