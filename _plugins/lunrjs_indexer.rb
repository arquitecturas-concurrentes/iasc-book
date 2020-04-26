require 'json'
require 'v8'

module Jekyll
  class LunrGenerator < Jekyll::Generator
    priority :lowest
    attr_accessor :config

    DEFAULT_INDEX_FILE = '/index.json/'
    DEFAULT_EXCLUDE = []

    def generate(site)
      Jekyll.logger.info "Lunr:", 'Creating search index...'

      lunr_config = site.config['lunr'] || {}
      self.config = {}
      self.config['fiilename'] = lunr_config['filename'] || DEFAULT_INDEX_FILE
      self.config['exlcude'] = lunr_config['exlcude'] || DEFAULT_EXCLUDE

      @site = site
      @renderer = LunrGeneratorAbstractions::LunrRenderer.new(@site)

      get_pages.each_with_index do |page, index|
        search_entry = LunrGeneratorAbstractions::SearchEntry.new(site, page, @renderer)
        search_entry.dump_to_js_index index
      end
    end

    def output_text(resource)
      return Jekyll::Renderer.new(@site, resource).output_ext if resource.is_a?(Jekyll::Document)
      resource.output_ext
    end

    def resource_output_html?(resource)
      output_text(resource) == '.html'
    end

    def get_pages
      pages = @site.pages.map(&:dup)
      pages.select! { |page| page.respond_to?(:output_text) &&  resource_output_html?(page) }
    end
  end

  require 'nokogiri'
  require 'date'

  module LunrGeneratorAbstractions
    class SearchEntry
      attr_accessor :site, :resource, :title, :body, :create_date, :categories, :url, :path
      def initialize(site, resource, renderer)
        self.site = site
        self.resource = resource

        if is_post?
          self.create_date = resource.date
          self.categories =  resource.categories
        else
          self.create_date = Time.now.strftime("%d/%m/%Y")
          self.categories = []
        end

        self.body = renderer.render(resource)
        self.title, self.path, self.url = get_title_path_url_from_liquid
      end

      def get_title_path_url_from_liquid
        liquid_data = self.resource.to_liquid
        [ liquid_data['title'], liquid_data['path'], liquid_data['url'] ]
      end

      def is_post?
        site.posts.include? self.resource
      end

      def dump_to_js_index(idx_number)
        {
            id: idx_number,
            title: self.title,
            date: self.create_date,
            url: self.url,
            categories: self.categories || [],
            # Remove emojis by force non-emoji encoding temporarily. See https://github.com/olivernn/lunr.js/issues/243
            body: self.body.force_encoding("ISO-8859-1").encode("UTF-8")
        }
      end
    end

    class LunrRenderer
      attr_accessor :site

      def initialize(site)
        self.site = site
      end

      def get_layoutless_content(resource)
        layout = resource.data['layout']
        begin
          resource.data.delete('layout')
          output = Jekyll::Renderer.new(self.site, resource).run
        ensure
          resource.data['layout'] = layout
        end

        output
      end

      def render(resource)
        dup_resource = resource.dup

        Nokogiri::HTML(get_layoutless_content(dup_resource)).text
      end
    end
  end
end
