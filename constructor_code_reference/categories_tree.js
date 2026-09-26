Vue.component('pp_categories_tree', {
    template: `
        <div>
             <treeselect
                    :options="normalized_categories"
                    v-model="selected"
                    
                    :flat="true"
                    :multiple="multiple"
                    :clearable="clearable"
                    :searchable="searchable"
                    
                    @input="e_update"
                    
                    :placeholder="lang('choose_categories')"
                    :clearAllText="lang('choose_categories')"
                    :clearValueText="lang('delete')"
                    :noResultsText="lang('no_results')"
                    :noChildrenText="''"
                    :noOptionsText="''"
                    :searchPromptText="''"
                />
        </div>
        `,
    components: {
        'treeselect': window.VueTreeselect.Treeselect
    },
    props: {
        controller: {
            type: String,
            default: 'materials'
        },
        top_only:{
            type: [Boolean, Number],
            default: 0
        },
        multiple: {
            type: Boolean,
            default: true,
        },
        clearable: {
            type: Boolean,
            default: true,
        },
        searchable: {
            type: Boolean,
            default: true,
        },
        value: {
            type: [String, Number, Array],
            default: function () {
                if(this.multiple) return [];
                return undefined;
            }
        },
        available_categories: {
            type: Array,
            default: function (){
                return []
            }
        }
    },
    data: function () {
        return {
            categories: [],
            selected: [],
            placeholder_text: glob.lang['choose_categories'],
            options_ready: false,
        };
    },
    created: async function () {
        await this.get_data();
        if(this.multiple){
            if(Array.isArray(this.value)){
                this.selected = this.value
            } else {
                this.selected = [this.value]
            }
        } else {
            if(Array.isArray(this.value)){
                this.selected = this.value[0]
            } else {
                this.selected = this.value
            }
        }

        this.placeholder_text = this.lang('choose_categories')
        this.options_ready = true;

    },
    computed: {
        normalized_categories() {
            const normalize = (node) => ({
                id: node.id,
                label: node.name,
                isDefaultExpanded: true,
                children: Array.isArray(node.children) && node.children.length ? node.children.map(normalize) : undefined
            });
            return this.categories.map(normalize);
        }
    },
    watch: {
        available_categories: async function (o,n){
            await this.get_data();
        }
    },
    mounted: async function () {

    },
    methods: {
        lang(key){
            return glob.lang[key]
        },
        get_data: async function(){

            let categories_url = (this.controller === 'materials_keys') ?
                glob.base_url + '/catalog/' + 'items_get' + '/' + this.controller :
                glob.base_url + '/catalog/' + glob.c_method_name + '/' + this.controller

            let data;


            if(this.available_categories.length){
                let fdata = new FormData();
                fdata.append('name', this.controller)
                fdata.append('categories', JSON.stringify(this.available_categories))
                let categories_url = glob.base_url + '/catalog/categories_get_multi'

                data = await promise_request_post(categories_url, fdata);
            } else {
                data = await promise_request(categories_url);
            }

            if(this.top_only) data = data.filter(cat => Number(cat.parent) == 0)

            this.categories = build_category_tree(data)
        },

        e_update: function () {
            if(this.selected){
                this.$emit('e_update', copy_object(this.selected));
            } else {
                this.$emit('e_update', 0);
            }

        }
    }
})

Vue.component('pp_type_and_category_tree', {
    template: `
        <div class="row">
            <div class="col-sm-4">
                <label>{{lang('type')}}</label>
                <treeselect
                    :options="type_options"
                    v-model="selected_type"
                    :clearable="true"
                    :searchable="true"
                    :placeholder="lang('choose_type')"
                    @input="on_type_change"
                />
            </div>
            <div class="col-sm-8">
                <label>{{lang('category')}}</label>
                <treeselect
                    :disabled="selected_type ? false : true"
                    :options="normalized_categories"
                    v-model="selected_category"
                    :multiple="multiple"
                    :flat="true"  
                    :clearable="clearable"
                    :searchable="searchable"
                    :placeholder="lang('choose_categories')"
                    :clearAllText="lang('choose_categories')"
                    :clearValueText="lang('delete')"
                    :noResultsText="lang('no_results')"
                    @input="e_update"
                />
            </div>
        </div>

    `,
    components: {
        'treeselect': window.VueTreeselect.Treeselect
    },
    props: {
        multiple: {
            type: Boolean,
            default: true,
        },
        clearable: {
            type: Boolean,
            default: true,
        },
        searchable: {
            type: Boolean,
            default: true,
        },
        value: {
            type: [String, Number, Array],
            default: function () {
                if(this.multiple) return [];
                return undefined;
            }
        },
        available_keys: {
            type: Array,
            default: function (){
                return []
            }
        },
        controller:{
            type: String,
            default: 'materials',
        }
    },
    data() {
        return {
            type_options: [],
            selected_type: null,
            categories: [],
            selected_category: [],
            categories_method: 'categories_get',
        };
    },
    watch: {
        available_keys: {
            handler() {
                this.get_types();
            },
            immediate: true
        }

    },
    created: async function () {
        
        await this.get_types();
    },
    computed: {
        normalized_categories() {
            const normalize = (node) => ({
                id: node.id,
                label: node.name,
                isDefaultExpanded: true,
                children: Array.isArray(node.children) && node.children.length ? node.children.map(normalize) : undefined
            });
            return this.categories.map(normalize);
        }
    },
    methods: {
        lang(key){
            return glob.lang[key] || key;
        },
        async get_types() {
            if(Array.isArray(this.available_keys) && this.available_keys.length){
                this.type_options = this.available_keys.map(k => ({
                    id: k.key,      
                    label: k.name     
                }));
            }else{
                let keys_url = glob.base_url + '/catalog/' + 'items_get' + '/' + this.controller;
                let result = await promise_request(keys_url);
                this.type_options = result.map(k => ({
                    id: k.key,      
                    label: k.name     
                }));
            }


            

        },  
        async on_type_change() {
            this.selected_category = this.multiple ? [] : null;
            if(this.selected_type){
                await this.get_categories_by_type(this.selected_type);
            }
            this.e_update();
        },
        async get_categories_by_type(type) {
              
                let table_name = this.get_catalog_table_name(type);
                let categories_url = glob.base_url + '/catalog/' + this.categories_method + '/' + table_name
                let data = await promise_request(categories_url);
                this.$options.categories_hash = get_hash(data)
                this.categories = build_category_tree(data)
        },
        get_catalog_table_name(type) {
            let base = this.controller.split('_')[0]; 
            if (base.endsWith('s')) {
                base = base.slice(0, -1); 
            }
            return `${base}_${type}`; 
        },
        e_update() {
            this.$emit('e_update', {
                type: this.selected_type,
                categories: copy_object(this.selected_category),
                hash: this.$options.categories_hash
            });
        }
    }
});


