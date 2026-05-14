import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useApiData } from '../hooks/useApiData';
import { categories as mockCategories } from '../mock/finance';
import { createCategory, createCategoryRule, deleteCategory, deleteCategoryRule, listCategories, listCategoryRules, updateCategory, updateCategoryRule } from '../services/api';
import type { Category, CategoryGroup, CategoryRule } from '../types/finance';

const categoryGroups: CategoryGroup[] = ['Income', 'Housing', 'Living', 'Transport', 'Business', 'Investment Property', 'Tax', 'Transfers'];

const emptyCategoryForm = {
  name: '',
  group: 'Living' as CategoryGroup,
  taxDeductible: false,
  businessUsePercent: '',
};

const emptyRuleForm = {
  name: '',
  pattern: '',
  categoryId: '',
  matchType: 'contains' as CategoryRule['matchType'],
  priority: '50',
  taxTag: '',
  businessUsePercent: '',
  isActive: true,
};

export default function Categories() {
  const loadCategories = useCallback(() => listCategories(), []);
  const loadRules = useCallback(() => listCategoryRules(), []);
  const { data: categories, reload: reloadCategories } = useApiData(loadCategories, mockCategories);
  const { data: rules, reload: reloadRules } = useApiData<CategoryRule[]>(loadRules, []);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({ ...emptyRuleForm, categoryId: mockCategories[0]?.id ?? '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedCategory = useMemo(() => categories.find((category) => category.id === editingCategoryId), [categories, editingCategoryId]);

  useEffect(() => {
    if (!categories.some((category) => category.id === ruleForm.categoryId)) {
      setRuleForm((value) => ({ ...value, categoryId: categories[0]?.id ?? '' }));
    }
  }, [categories, ruleForm.categoryId]);

  function startEditCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      group: category.group,
      taxDeductible: category.taxDeductible,
      businessUsePercent: category.businessUsePercent === undefined ? '' : String(category.businessUsePercent),
    });
    setMessage(null);
    setError(null);
  }

  function resetCategoryForm() {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    setMessage(null);
    setError(null);
  }

  async function handleSaveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const businessUsePercent = categoryForm.businessUsePercent.trim() === '' ? undefined : Number(categoryForm.businessUsePercent);
    if (businessUsePercent !== undefined && (!Number.isInteger(businessUsePercent) || businessUsePercent < 0 || businessUsePercent > 100)) {
      setError('Business use must be a whole percentage from 0 to 100.');
      return;
    }

    try {
      const payload = {
        name: categoryForm.name,
        group: categoryForm.group,
        taxDeductible: categoryForm.taxDeductible,
        businessUsePercent,
      };

      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
        setMessage(`Updated ${categoryForm.name}.`);
      } else {
        await createCategory(payload);
        setMessage(`Created ${categoryForm.name}.`);
      }

      setEditingCategoryId(null);
      setCategoryForm(emptyCategoryForm);
      reloadCategories();
      reloadRules();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save category');
    }
  }

  async function handleDeleteCategory(category: Category) {
    if (!window.confirm(`Delete ${category.name}? This is only allowed when the category has no linked transactions or rules.`)) {
      return;
    }

    setMessage(null);
    setError(null);

    try {
      await deleteCategory(category.id);
      if (editingCategoryId === category.id) {
        setEditingCategoryId(null);
        setCategoryForm(emptyCategoryForm);
      }
      setMessage(`Deleted ${category.name}.`);
      reloadCategories();
      reloadRules();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete category');
    }
  }

  function startEditRule(rule: CategoryRule) {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      pattern: rule.pattern,
      categoryId: rule.categoryId,
      matchType: rule.matchType,
      priority: String(rule.priority),
      taxTag: rule.taxTag ?? '',
      businessUsePercent: rule.businessUsePercent === undefined ? '' : String(rule.businessUsePercent),
      isActive: rule.isActive,
    });
    setMessage(null);
    setError(null);
  }

  function resetRuleForm() {
    setEditingRuleId(null);
    setRuleForm({ ...emptyRuleForm, categoryId: categories[0]?.id ?? '' });
    setMessage(null);
    setError(null);
  }

  async function handleSaveRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const priority = Number(ruleForm.priority);
    const businessUsePercent = ruleForm.businessUsePercent.trim() === '' ? undefined : Number(ruleForm.businessUsePercent);
    if (!Number.isInteger(priority) || priority < 1 || priority > 999) {
      setError('Priority must be a whole number from 1 to 999.');
      return;
    }

    if (businessUsePercent !== undefined && (!Number.isInteger(businessUsePercent) || businessUsePercent < 0 || businessUsePercent > 100)) {
      setError('Business use must be a whole percentage from 0 to 100.');
      return;
    }

    try {
      const payload = {
        name: ruleForm.name,
        categoryId: ruleForm.categoryId,
        matchType: ruleForm.matchType,
        pattern: ruleForm.pattern,
        priority,
        taxTag: ruleForm.taxTag.trim() || undefined,
        businessUsePercent,
        isActive: ruleForm.isActive,
      };

      if (editingRuleId) {
        await updateCategoryRule(editingRuleId, payload);
        setMessage('Rule updated.');
      } else {
        await createCategoryRule(payload);
        setMessage('Rule created.');
      }

      setEditingRuleId(null);
      setRuleForm({ ...emptyRuleForm, categoryId: categories[0]?.id ?? '' });
      reloadRules();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save rule');
    }
  }

  async function handleDeleteRule(rule: CategoryRule) {
    if (!window.confirm(`Delete rule ${rule.name}?`)) {
      return;
    }

    setMessage(null);
    setError(null);

    try {
      await deleteCategoryRule(rule.id);
      if (editingRuleId === rule.id) {
        resetRuleForm();
      }
      setMessage('Rule deleted.');
      reloadRules();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete rule');
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="mt-1 text-sm text-slate-500">Category catalogue and matching rules used by the reconciliation engine.</p>
      </header>

      <Card>
        <CardHeader><h2 className="text-base font-semibold">{selectedCategory ? `Edit ${selectedCategory.name}` : 'Add category'}</h2></CardHeader>
        <form className="grid gap-3 p-5 md:grid-cols-[1fr_210px_160px_170px_auto]" onSubmit={handleSaveCategory}>
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={categoryForm.name}
            onChange={(event) => setCategoryForm((value) => ({ ...value, name: event.target.value }))}
            placeholder="Category name"
            required
          />
          <select
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={categoryForm.group}
            onChange={(event) => setCategoryForm((value) => ({ ...value, group: event.target.value as CategoryGroup }))}
          >
            {categoryGroups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-slate-700">
            <input
              checked={categoryForm.taxDeductible}
              type="checkbox"
              onChange={(event) => setCategoryForm((value) => ({ ...value, taxDeductible: event.target.checked }))}
            />
            Tax deductible
          </label>
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm"
            inputMode="numeric"
            value={categoryForm.businessUsePercent}
            onChange={(event) => setCategoryForm((value) => ({ ...value, businessUsePercent: event.target.value }))}
            placeholder="Business %"
          />
          <div className="flex gap-2">
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit">{editingCategoryId ? 'Update' : 'Add'}</button>
            {editingCategoryId && <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700" type="button" onClick={resetCategoryForm}>Cancel</button>}
          </div>
          {message && <p className="text-sm font-medium text-emerald-700 md:col-span-5">{message}</p>}
          {error && <p className="text-sm font-medium text-rose-700 md:col-span-5">{error}</p>}
        </form>
      </Card>

      <Card>
        <CardHeader><h2 className="text-base font-semibold">Categories</h2></CardHeader>
        <DataTable<Category>
          rows={categories}
          getRowKey={(row) => row.id}
          columns={[
            { key: 'name', header: 'Category', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
            { key: 'group', header: 'Group', render: (row) => row.group },
            { key: 'deductible', header: 'Tax deductible', render: (row) => <Badge tone={row.taxDeductible ? 'success' : 'neutral'}>{row.taxDeductible ? 'Yes' : 'No'}</Badge> },
            { key: 'business', header: 'Business use', align: 'right', render: (row) => (row.businessUsePercent === undefined ? '-' : `${row.businessUsePercent}%`) },
            {
              key: 'action',
              header: 'Action',
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-700" type="button" onClick={() => startEditCategory(row)}>Edit</button>
                  <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700" type="button" onClick={() => handleDeleteCategory(row)}>Delete</button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card>
        <CardHeader><h2 className="text-base font-semibold">{editingRuleId ? 'Edit rule' : 'Create rule'}</h2></CardHeader>
        <form className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_170px_220px_100px_auto]" onSubmit={handleSaveRule}>
          <input className="rounded-lg border border-line px-3 py-2 text-sm" value={ruleForm.name} onChange={(event) => setRuleForm((value) => ({ ...value, name: event.target.value }))} placeholder="Rule name" required />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" value={ruleForm.pattern} onChange={(event) => setRuleForm((value) => ({ ...value, pattern: event.target.value }))} placeholder="Description pattern" required />
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={ruleForm.matchType} onChange={(event) => setRuleForm((value) => ({ ...value, matchType: event.target.value as CategoryRule['matchType'] }))}>
            <option value="contains">contains</option>
            <option value="starts_with">starts with</option>
            <option value="exact">exact</option>
          </select>
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={ruleForm.categoryId} onChange={(event) => setRuleForm((value) => ({ ...value, categoryId: event.target.value }))}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input className="rounded-lg border border-line px-3 py-2 text-sm" value={ruleForm.priority} onChange={(event) => setRuleForm((value) => ({ ...value, priority: event.target.value }))} placeholder="Priority" required />
          <div className="flex gap-2">
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit" disabled={!ruleForm.categoryId}>{editingRuleId ? 'Update' : 'Create'}</button>
            {editingRuleId && <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700" type="button" onClick={resetRuleForm}>Cancel</button>}
          </div>
          <input className="rounded-lg border border-line px-3 py-2 text-sm md:col-span-2" value={ruleForm.taxTag} onChange={(event) => setRuleForm((value) => ({ ...value, taxTag: event.target.value }))} placeholder="Tax tag" />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" value={ruleForm.businessUsePercent} onChange={(event) => setRuleForm((value) => ({ ...value, businessUsePercent: event.target.value }))} placeholder="Business %" />
          <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-slate-700">
            <input checked={ruleForm.isActive} type="checkbox" onChange={(event) => setRuleForm((value) => ({ ...value, isActive: event.target.checked }))} />
            Active
          </label>
        </form>
      </Card>

      <Card>
        <CardHeader><h2 className="text-base font-semibold">Category rules</h2></CardHeader>
        <DataTable<CategoryRule>
          rows={rules}
          getRowKey={(row) => row.id}
          emptyMessage="Start the API server to load category matching rules."
          columns={[
            { key: 'name', header: 'Rule', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
            { key: 'pattern', header: 'Pattern', render: (row) => row.pattern },
            { key: 'match', header: 'Match', render: (row) => row.matchType },
            { key: 'category', header: 'Category', render: (row) => row.categoryName },
            { key: 'tax', header: 'Tax tag', render: (row) => row.taxTag ?? '-' },
            { key: 'priority', header: 'Priority', align: 'right', render: (row) => row.priority },
            { key: 'active', header: 'Active', render: (row) => <Badge tone={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Yes' : 'No'}</Badge> },
            {
              key: 'action',
              header: 'Action',
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-700" type="button" onClick={() => startEditRule(row)}>Edit</button>
                  <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700" type="button" onClick={() => handleDeleteRule(row)}>Delete</button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
