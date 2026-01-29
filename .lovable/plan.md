# Plano de Otimização Mobile - Nova Era Dashboard

## 📱 Diagnóstico Atual

### Problemas Identificados:

#### 1. **Página de Login (Auth.tsx)**
- ✅ Já está bem responsivo
- ⚠️ Logo pode ficar grande demais em telas muito pequenas (h-28)
- ⚠️ Padding do card (p-8) pode ser excessivo em mobile

#### 2. **Header do Dashboard (DashboardHeader.tsx)**
- ⚠️ Botões "Nossa Loja" e "Consulte sua proxy" ocupam muito espaço horizontal
- ⚠️ Em mobile, os 3 botões com flex-1 podem ficar apertados
- ⚠️ Texto dos botões pode quebrar em telas pequenas

#### 3. **Abas do Dashboard (Dashboard.tsx)**
- ⚠️ TabsList com muitas abas (8 no total) - difícil navegar em mobile
- ⚠️ Ícones + texto nas abas ocupam muito espaço
- ⚠️ Overflow horizontal pode não ser óbvio para usuário

#### 4. **Filtro de Data (DateFilter.tsx)**
- ⚠️ Em telas muito pequenas, os 4 elementos (2 botões + 2 date pickers) podem empilhar mal
- ⚠️ Formato de data "dd/MM/yy" está ok, mas layout pode melhorar

#### 5. **Cards de Estatísticas (StatsCard.tsx)**
- ⚠️ Grid 2 colunas em mobile pode fazer cards ficarem apertados
- ⚠️ Valores monetários longos podem não caber

#### 6. **Métodos Tab (MethodsTab.tsx / MethodPostBubble.tsx)**
- ✅ Já otimizado recentemente
- ⚠️ Pode precisar ajustes finos

---

## 🎯 Plano de Ação

### Fase 1: Header Mobile (Prioridade Alta) ⬅️ COMEÇAR AQUI
- [ ] Reorganizar botões do header em mobile para layout vertical
- [ ] Usar texto menor nos botões em mobile
- [ ] Empilhar "Nova Operação" separado dos links externos
- [ ] Reduzir padding geral do header em mobile

### Fase 2: Navegação por Abas (Prioridade Alta)
- [ ] Melhorar indicador visual de scroll horizontal
- [ ] Mostrar apenas ícones em mobile com tooltips
- [ ] Adicionar gradiente de fade nas bordas para indicar scroll
- [ ] Aumentar padding lateral para melhor scroll touch

### Fase 3: Página de Login (Prioridade Média)
- [ ] Reduzir tamanho do logo em telas pequenas (h-20 sm:h-28)
- [ ] Ajustar padding do card (p-5 sm:p-8)
- [ ] Reduzir espaçamento vertical entre elementos

### Fase 4: Filtros de Data (Prioridade Média)
- [ ] Empilhar filtros em 2 linhas em mobile
- [ ] Usar layout mais compacto com gap menor

### Fase 5: Cards de Stats (Prioridade Baixa)
- [ ] Ajustar auto-scale de fonte para valores grandes
- [ ] Melhorar truncamento com tooltip

### Fase 6: Testes Finais
- [ ] Testar em 320px (iPhone SE)
- [ ] Testar em 375px (iPhone 12/13)  
- [ ] Testar em 390px (iPhone 14)
- [ ] Verificar touch targets (mínimo 44x44px)

---

## 📐 Breakpoints de Referência

| Breakpoint | Tamanho | Dispositivos |
|------------|---------|--------------|
| default | < 640px | Mobile |
| sm | 640px+ | Mobile grande |
| md | 768px+ | Tablet |
| lg | 1024px+ | Desktop |

---

## Status: 🟡 Aguardando Aprovação

Deseja que eu inicie a implementação começando pelo **Header do Dashboard**?
