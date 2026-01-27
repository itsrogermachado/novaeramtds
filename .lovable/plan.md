
## Plano: Separar Gastos Efetivados vs Agendados

### Objetivo
Garantir que gastos futuros (data > hoje) NÃO impactem os cálculos financeiros do dashboard, mantendo-os visíveis como "Agendados" para projeção.

---

### Regras de Negócio

| Tipo de Gasto | Impacta Cálculos? | Exibição |
|---------------|-------------------|----------|
| `expense_date <= hoje` | SIM | Badge "Efetivado" (verde) |
| `expense_date > hoje` | NAO | Badge "Agendado" (amarelo) |

---

### Arquivos a Modificar

#### 1. `src/hooks/useExpenses.ts`
Adicionar uma função auxiliar e exportar gastos separados:

```typescript
// Função helper para verificar se gasto está efetivado
export function isExpenseEffective(expense: Expense): boolean {
  const today = format(new Date(), 'yyyy-MM-dd');
  return expense.expense_date <= today;
}

// No retorno do hook, adicionar:
return {
  expenses,           // Todos os gastos (para exibição na tabela)
  effectiveExpenses,  // Apenas gastos efetivados (para cálculos)
  upcomingExpenses,
  ...
}
```

---

#### 2. `src/pages/Dashboard.tsx`
Usar `effectiveExpenses` para todos os cálculos:

**Antes:**
```typescript
const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
```

**Depois:**
```typescript
const { expenses, effectiveExpenses } = useExpenses(dateRange);

// Para cálculos - usar apenas efetivados
const totalExpenses = effectiveExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

// Para exibição na tabela - usar todos
<ExpensesTable expenses={expenses} ... />
```

---

#### 3. `src/components/dashboard/ExpensesTable.tsx`
Adicionar badge de status visual:

```text
+--------------------------------------------------+
| Data       | Categoria | Status      | Valor    |
+--------------------------------------------------+
| 20/01      | Aluguel   | [Efetivado] | -R$ 500  |
| 25/01      | Internet  | [Efetivado] | -R$ 100  |
| 15/02      | Energia   | [Agendado]  | -R$ 200  |
+--------------------------------------------------+
```

- Adicionar coluna "Status" com badge colorido
- "Efetivado" = verde (`bg-success/20 text-success`)
- "Agendado" = amarelo (`bg-warning/20 text-warning`)

---

#### 4. `src/components/dashboard/ExpensesByCategoryChart.tsx`
Filtrar apenas gastos efetivados antes de montar o grafico:

```typescript
const effectiveExpenses = expenses.filter(exp => exp.expense_date <= today);
// usar effectiveExpenses para o chartData
```

---

#### 5. `src/hooks/useMonthlyComparison.ts`
Filtrar gastos futuros nos comparativos mensais:

```typescript
const today = format(new Date(), 'yyyy-MM-dd');

// Filtrar apenas gastos efetivados
const monthExps = expenses.filter(exp => 
  exp.expense_date.slice(0, 7) === monthKey &&
  exp.expense_date <= today
);
```

---

#### 6. `src/components/dashboard/AdminGlobalTab.tsx`
Receber `effectiveExpenses` para calculos globais corretamente.

---

### Fluxo de Dados Atualizado

```text
useExpenses()
    |
    +-- expenses (todos) ---------> ExpensesTable (exibição)
    |
    +-- effectiveExpenses --------> Dashboard (cálculos)
                                    |
                                    +-> Card "Gastos"
                                    +-> Card "Saldo" 
                                    +-> Card "Lucro"
                                    +-> Gráficos
                                    +-> Comparativos
```

---

### Detalhes Técnicos

#### Helper de Verificação (useExpenses.ts)
```typescript
import { format } from 'date-fns';

export function isExpenseEffective(expense: Expense): boolean {
  const today = format(new Date(), 'yyyy-MM-dd');
  return expense.expense_date <= today;
}
```

#### Filtro no Hook
```typescript
const effectiveExpenses = useMemo(() => 
  expenses.filter(isExpenseEffective), 
  [expenses]
);
```

#### Badge de Status (ExpensesTable.tsx)
```tsx
import { isExpenseEffective } from '@/hooks/useExpenses';
import { Clock, CheckCircle } from 'lucide-react';

// Na célula de status:
{isExpenseEffective(expense) ? (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
    <CheckCircle className="h-3 w-3" />
    Efetivado
  </span>
) : (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning">
    <Clock className="h-3 w-3" />
    Agendado
  </span>
)}
```

---

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useExpenses.ts` | Adicionar `isExpenseEffective()` e `effectiveExpenses` |
| `src/pages/Dashboard.tsx` | Usar `effectiveExpenses` para cálculos |
| `src/components/dashboard/ExpensesTable.tsx` | Adicionar coluna "Status" com badges |
| `src/components/dashboard/ExpensesByCategoryChart.tsx` | Filtrar gastos futuros |
| `src/hooks/useMonthlyComparison.ts` | Filtrar gastos futuros nos comparativos |
| `src/components/dashboard/AdminGlobalTab.tsx` | Usar gastos efetivados |

---

### Resultado Esperado

**Cards do Dashboard:**
- "Gastos" mostra apenas valores de gastos com data <= hoje
- "Saldo" calcula corretamente sem gastos futuros
- "Lucro" não é afetado por projeções

**Tabela de Gastos:**
- Exibe todos os gastos (passados e futuros)
- Badge visual distingue "Efetivado" de "Agendado"
- Gastos agendados aparecem mas não impactam totais

**Gráficos:**
- Apenas gastos efetivados aparecem nos gráficos
- Comparativos mensais usam dados reais apenas

**Comportamento Automático:**
- Quando a data do gasto chegar, ele automaticamente passa a impactar os cálculos
- Nenhuma ação manual necessária
