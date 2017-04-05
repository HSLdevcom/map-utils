import re

def main():
    unique_route_numbers = ['10','11','12','20','22','23','24','25','26']
    routes_to_generalize = ['10','10K','11','12','22','22N','24K','26']
    route_separator = ' '

    route_letters = make_route_letter_list(unique_route_numbers, routes_to_generalize)
    label = generate_label(unique_route_numbers, route_letters, route_separator)
    print(label)


def generate_label(unique_route_numbers, route_letters, separator_char):
    label_text = ''
    subsequent_routes = []
    last = len(unique_route_numbers)-1
    for i, (letters, route_number) in enumerate(zip(route_letters, unique_route_numbers)):
        if len(letters) > 0:
            subsequent_routes.append(route_number)
            if (i != last and len(route_letters[i+1]) == 0) or i == last:
                if len(subsequent_routes) > 1:
                    label_text += generalize_list(subsequent_routes, separator_char)
                    label_text += separator_char
                else:
                    label_text += add_variable_routes(route_number, letters, separator_char)

                del subsequent_routes[:]

    # remove extra separator_char from end
    return label_text.strip(separator_char)



def make_route_letter_list(unique_routes, routes):
    """ Return list of route letters with same length as unique_routes
        (puts empty list in list if there are no routes)
        e.g if unique_routes has ['10','11','12'] and routes ['10K','10KT','11']
        function returns [['K', 'KT'], [''], []]
    """
    routes_as_letters = []
    nums, letters = split_route_strings(routes)
    for unique_route_num in unique_routes:
        temp_letters = []
        for num, letter in zip(nums, letters):
            if num == unique_route_num:
                temp_letters.append(letter)
        routes_as_letters.append(sorted(temp_letters))
    return routes_as_letters


def split_route_strings(routes):
    route_nums = []
    route_letters = []
    for route in routes:
        route_num, route_letter = split_string(route)
        route_nums.append(route_num)
        route_letters.append(route_letter)
    return route_nums, route_letters


def split_string(route_text):
    number, letter = re.split(r'(\d+)', route_text)[1:]
    return number, letter


def generalize_list(subseq_routes, separator_char):
    """ Return subsequent routes either in format
        start-end e.g. 122-156 (if more than 2 routes)
        or separated by separator character e.g. 122,123 """
    text = str(subseq_routes[0])
    if len(subseq_routes) > 2:
        text += '-'
    else:
        text += separator_char
    text += str(subseq_routes[-1])
    return text


def add_variable_routes(number, letters, separator_char):
    """ Return all the variable routes added to route number
        e.g. 120,120N,120NK """
    text = ''
    for letter in letters:
        text += str(number) + letter + separator_char
    return text

if __name__ == '__main__':
    main()
